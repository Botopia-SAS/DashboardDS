import { NextRequest, NextResponse } from "next/server";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import Joi from "joi";
import Location from "@/lib/models/Locations";

const ticketClassSchema = Joi.object({
  locationId: Joi.string().required(),
  date: Joi.date().iso().required(),
  hour: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),
  classId: Joi.string().required(),
  instructorId: Joi.string().required(),
  students: Joi.array().items(Joi.string()).default([]),
}).unknown(false);

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const requestData = await req.json();

    const { error, value } = ticketClassSchema.validate(requestData);

    // Validar que los datos esenciales estén presentes
    if (error) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.details.map((err) => err.message),
        },
        { status: 400 }
      );
    }

    const { date, hour, instructorId, students } = value;

    // Verificar que el instructor no tenga otra clase en la misma fecha y hora
    const existingClass = await TicketClass.findOne({
      date,
      hour,
      instructorId,
    });

    const existLocation = await Location.findOne({ _id: value.locationId }).exec();
    if (!existLocation) {
      return NextResponse.json(
        {
          error: "La ubicación no existe.",
        },
        { status: 400 }
      );
    } 
    if (existingClass) {
      return NextResponse.json(
        {
          error: "El instructor ya tiene una clase programada en este horario.",
        },
        { status: 400 }
      );
    }

    // Verificar que los estudiantes no tengan otra clase en el mismo horario
    const studentConflict = await TicketClass.findOne({
      date,
      hour,
      students: { $in: students },
    });


    if (studentConflict) {
      return NextResponse.json(
        {
          error:
            "Uno o más estudiantes ya están inscritos en otra clase en este horario.",
        },
        { status: 400 }
      );
    }

    // Crear la nueva clase
    const newClass = await TicketClass.create(requestData);
    await newClass.save();

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error al crear la clase:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function GET() {
  await connectToDB();
  const classes = await TicketClass.find().lean();

  // Fetch location names for each class
  const locationIds = classes.map((cls) => cls.locationId);
  const locations = await Location.find({ _id: { $in: locationIds } }).lean();

  const locationMap: { [key: string]: string } = locations.reduce((acc, loc) => {
    acc[loc?._id.toString()] = loc.zone;
    return acc;
  }, {} as { [key: string]: string });

  const classesWithLocationNames = classes.map((cls) => ({
    ...cls,
    locationName: locationMap[cls.locationId.toString()] || "Unknown Location",
  }));

  return NextResponse.json(classesWithLocationNames);
}
