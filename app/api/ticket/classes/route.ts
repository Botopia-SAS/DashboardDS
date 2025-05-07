import { NextRequest, NextResponse } from "next/server";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import Joi from "joi";
import Location from "@/lib/models/Locations";
import DrivingClass from "@/lib/models/Class";
import Instructor from "@/lib/models/Instructor";

const ticketClassSchema = Joi.object({
  locationId: Joi.string().required(),
  date: Joi.date().iso().required(),
  hour: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required(),
  classId: Joi.string().required(),
  type: Joi.string().valid("date", "bdi", "adi").required(),
  duration: Joi.string()
    .valid("standard", "4h", "8h", "agressive", "12h")
    .required(),
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

interface DrivingClassDoc {
  _id: string;
  title: string;
  duration?: string;
}

interface InstructorDoc {
  _id: string;
  name: string;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const requestData = await req.json();
    const { error, value } = ticketClassSchema.validate(requestData);

    if (error) {
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
      instructorId,
      students,
      locationId,
      classId,
      duration,
    } = value;

    // Verify that the location exists
    const existLocation = await Location.findOne({ _id: locationId }).exec();
    if (!existLocation) {
      return NextResponse.json(
        { error: "The location does not exist." },
        { status: 400 }
      );
    }

    // Verify that the class exists and check if duration matches
    const existClass = await DrivingClass.findOne({ _id: classId }).exec();
    if (!existClass) {
      return NextResponse.json(
        { error: "The class does not exist." },
        { status: 400 }
      );
    }

    // Verify that the duration matches the selected class
    if (existClass.duration && existClass.duration !== duration) {
      return NextResponse.json(
        { error: "The selected duration does not match the class duration." },
        { status: 400 }
      );
    }

    // We no longer validate the type against the class's classType
    // since the user can now select it manually

    // Verify that the instructor exists
    const existInstructor = await Instructor.findOne({
      _id: instructorId,
    }).exec();
    if (!existInstructor) {
      return NextResponse.json(
        { error: "The instructor does not exist." },
        { status: 400 }
      );
    }

    // Verify that the instructor is assigned to the selected location
    if (!existLocation.instructors.includes(instructorId)) {
      return NextResponse.json(
        { error: "The instructor is not assigned to this location." },
        { status: 400 }
      );
    }

    // Check that the instructor doesn't have another class at the same location, date and time
    const existingInstructorClass = await TicketClass.findOne({
      date,
      hour,
      instructorId,
    });

    if (existingInstructorClass) {
      return NextResponse.json(
        { error: "The instructor already has a class scheduled at this time." },
        { status: 400 }
      );
    }

    // Check that students don't have another class at the same date and time
    if (students && students.length > 0) {
      const studentConflict = await TicketClass.findOne({
        date,
        hour,
        students: { $in: students },
      });

      if (studentConflict) {
        return NextResponse.json(
          {
            error: "One or more students already have a class at this time.",
          },
          { status: 400 }
        );
      }
    }

    // Create the new class
    const newClass = await TicketClass.create(value);
    await newClass.save();

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

    // Fetch instructor names
    const instructorIds = classes.map((cls) => cls.instructorId);
    const instructors = await Instructor.find({
      _id: { $in: instructorIds },
    }).lean<InstructorDoc[]>();

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

    const instructorMap: { [key: string]: string } = instructors.reduce(
      (acc, inst) => {
        acc[inst?._id.toString()] = inst.name;
        return acc;
      },
      {} as { [key: string]: string }
    );

    // Enhance class data with related information
    const enhancedClasses = classes.map((cls) => ({
      ...cls,
      locationName:
        locationMap[cls.locationId.toString()] || "Unknown Location",
      className: classMap[cls.classId.toString()] || "Unknown Class",
      instructorName:
        instructorMap[cls.instructorId.toString()] || "Unknown Instructor",
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
