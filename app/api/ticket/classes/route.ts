import { NextRequest, NextResponse } from "next/server";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import Joi from "joi";
import Location from "@/lib/models/Locations";
import DrivingClass from "@/lib/models/Class";

const ticketClassSchema = Joi.object({
  locationId: Joi.string().required(),
  date: Joi.alternatives().try(
    Joi.date().iso(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
  ).required(),
  hour: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),
  endHour: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  classId: Joi.string().required(),
  type: Joi.string().lowercase().required(), // Acepta cualquier tipo de clase en minúsculas
  duration: Joi.string().valid("2h", "4h", "8h", "12h").required(),
  students: Joi.array().items(Joi.string()).default([]),
  spots: Joi.number().integer().min(1).default(30),
  studentRequests: Joi.array().items(Joi.string()).default([]),
  clientTempId: Joi.string().optional(), // Allow clientTempId for tracking purposes
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

interface DrivingClassDoc {
  _id: string;
  title: string;
  duration?: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const requestData = await req.json();
    // console.log("[API] ticket/classes POST - requestData:", requestData);
    
    const { error, value } = ticketClassSchema.validate(requestData);

    if (error) {
      console.error("[API] ticket/classes POST - Joi validation error:", error.details);
      console.error("[API] ticket/classes POST - Failed data:", requestData);
      return NextResponse.json(
        {
          error: "Invalid data",
          details: error.details.map((err) => err.message),
        },
        { status: 400 }
      );
    }

    const {
      date,
      hour,
      endHour,
      students,
      locationId,
      classId,
      duration,
      type,
      spots,
      studentRequests,
    } = value;

    // Normalize date to ensure it's in YYYY-MM-DD format (remove timezone info)
    let normalizedDate = date;
    if (typeof date === 'string') {
      if (date.includes('T')) {
        normalizedDate = date.split('T')[0];
      }
    } else if (date instanceof Date) {
      normalizedDate = date.toISOString().split('T')[0];
    }

    // console.log('[API] Date normalization:', {
    //   originalDate: date,
    //   normalizedDate: normalizedDate
    // });

    // Verify that the location exists
    const existLocation = await Location.findOne({ _id: locationId }).exec();
    if (!existLocation) {
      return NextResponse.json(
        { error: "The location does not exist." },
        { status: 400 }
      );
    } // Verify that the class exists
    const existClass = await DrivingClass.findOne({ _id: classId }).exec();
    if (!existClass) {
      return NextResponse.json(
        { error: "The class does not exist." },
        { status: 400 }
      );
    }

    // Calculate the expected duration format based on the class length
    // const expectedDuration = "";
    if (existClass.length) {
      if (existClass.length <= 2.5) {
        // expectedDuration = "2h";
      } else if (existClass.length <= 5) {
        // expectedDuration = "4h";
      } else if (existClass.length <= 10) {
        // expectedDuration = "8h";
      } else {
        // expectedDuration = "12h";
      }
    }

    // We no longer validate the type against the class's classType
    // since the user can now select it manually

    // Calculate end time if not provided
    let calculatedEndHour = endHour;
    if (!calculatedEndHour) {
      const startTime = new Date(`2000-01-01T${hour}:00`);
      const durationHours = parseInt(duration.replace('h', ''));
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
      calculatedEndHour = endTime.toTimeString().slice(0, 5);
    }

    // console.log('[API] Time validation:', {
    //   date: normalizedDate,
    //   startTime: hour,
    //   endTime: calculatedEndHour,
    //   duration
    // });

    // Function to check if two time ranges overlap
    // const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    //   const s1 = new Date(`2000-01-01T${start1}:00`);
    //   const e1 = new Date(`2000-01-01T${end1}:00`);
    //   const s2 = new Date(`2000-01-01T${start2}:00`);
    //   const e2 = new Date(`2000-01-01T${end2}:00`);
    //   return s1 < e2 && s2 < e1;
    // };

    // Validation removed: Students can now be in multiple classes at the same time

    // Create the new class with spots
    const classData = {
      ...value,
      date: normalizedDate, // Use normalized date
      endHour: calculatedEndHour,
      spots: spots || 30,
      students: students || [],
      studentRequests: studentRequests || [],
    };
    
    // console.log('[API] Creating TicketClass with data:', JSON.stringify(classData, null, 2));
    const newClass = await TicketClass.create(classData);
    await newClass.save();

    // Emit SSE notification for new ticket class
    try {
      await fetch('http://localhost:3000/api/notifications/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_ticket_class',
          data: {
            ticketClassId: newClass._id,
            type: type,
            date: normalizedDate
          }
        })
      });
    } catch (error) {

    }

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB();
    const queryType = req.nextUrl.searchParams.get("type");
    let query = {};

    if (queryType) {
      query = { type: queryType };
    }

    const classes = await TicketClass.find(query).lean();

    // Fetch location names for each class
    const locationIds = classes.map((cls) => cls.locationId);
    const locations = await Location.find({ _id: { $in: locationIds } }).lean<
      Location[]
    >();

    // Fetch class titles and details
    const classIds = classes.map((cls) => cls.classId);
    const drivingClasses = await DrivingClass.find({
      _id: { $in: classIds },
    }).lean<DrivingClassDoc[]>();

    // Create lookup tables for faster access
    const locationMap: { [key: string]: string } = locations.reduce(
      (acc, loc) => {
        acc[loc?._id.toString()] = loc.zone;
        return acc;
      },
      {} as { [key: string]: string }
    );

    const classMap: { [key: string]: string } = drivingClasses.reduce(
      (acc, cls) => {
        acc[cls?._id.toString()] = cls.title;
        return acc;
      },
      {} as { [key: string]: string }
    );

    // Enhance class data with related information (no instructor info)
    const enhancedClasses = classes.map((cls) => ({
      ...cls,
      locationName:
        locationMap[cls.locationId.toString()] || "Unknown Location",
      className: classMap[cls.classId.toString()] || "Unknown Class",
    }));

    return NextResponse.json(enhancedClasses);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes." },
      { status: 500 }
    );
  }
}


