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
  type: Joi.string().valid("date", "bdi", "adi").default("ticket"),
  duration: Joi.string()
    .valid("normal", "4h", "8h", "agressive", "12h")
    .default("normal"),
  instructorId: Joi.string().required(),
  students: Joi.array().items(Joi.string()).default([]),
}).unknown(false);

interface Location {
  title: string;
  zone: string;
  description: string;
  locationImage: string;
  instructors: string[];
  createdAt: Date;
  updatedAt: Date;
  _id: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const requestData = await req.json();
    const { error, value } = ticketClassSchema.validate(requestData);

    if (error) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.details.map((err) => err.message),
        },
        { status: 400 }
      );
    }

    const { date, hour, instructorId, students, locationId } = value;

    // Verificar que la ubicación existe
    const existLocation = await Location.findOne({ _id: locationId }).exec();
    if (!existLocation) {
      return NextResponse.json(
        { error: "La ubicación no existe." },
        { status: 400 }
      );
    }

    // Verificar que el instructor no tenga otra clase en la misma sede, fecha y hora
    const existingInstructorClass = await TicketClass.findOne({
      date,
      hour,
      locationId,
      instructorId,
    });

    if (existingInstructorClass) {
      return NextResponse.json(
        { error: "El instructor ya tiene una clase en este horario y sede." },
        { status: 400 }
      );
    }

    // Verificar que los estudiantes no tengan otra clase en la misma sede, fecha y hora
    const studentConflict = await TicketClass.findOne({
      date,
      hour,
      locationId,
      students: { $in: students },
    });

    if (studentConflict) {
      return NextResponse.json(
        {
          error:
            "Uno o más estudiantes ya tienen otra clase en este horario y sede.",
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

export async function GET(req: NextRequest) {
  await connectToDB();
  const type = req.nextUrl.searchParams.get("type");
  let query = {};

  if (type) {
    query = { type: type };
  }

  const classes = await TicketClass.find(query).lean();

  // Fetch location names for each class
  const locationIds = classes.map((cls) => cls.locationId);
  const locations = await Location.find({ _id: { $in: locationIds } }).lean<Location[]>();

  const locationMap: { [key: string]: string } = locations.reduce(
    (acc, loc) => {
      acc[loc?._id.toString()] = loc.zone;
      return acc;
    },
    {} as { [key: string]: string }
  );

  const classesWithLocationNames = classes.map((cls) => ({
    ...cls,
    locationName: locationMap[cls.locationId.toString()] || "Unknown Location",
  }));

  return NextResponse.json(classesWithLocationNames);
}
