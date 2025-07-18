import { NextRequest, NextResponse } from "next/server";
import TicketClass from "@/lib/models/TicketClass";
import { connectToDB } from "@/lib/mongoDB";
import Joi from "joi";
import Location from "@/lib/models/Locations";
import DrivingClass from "@/lib/models/Class";
import Instructor from "@/lib/models/Instructor";

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
  type: Joi.string().valid("date", "bdi", "adi").required(),
  duration: Joi.string().valid("2h", "4h", "8h", "12h").required(),
  instructorId: Joi.string().required(),
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

interface InstructorDoc {
  _id: string;
  name: string;
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
      instructorId,
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
    let expectedDuration = "";
    if (existClass.length) {
      if (existClass.length <= 2.5) {
        expectedDuration = "2h";
      } else if (existClass.length <= 5) {
        expectedDuration = "4h";
      } else if (existClass.length <= 10) {
        expectedDuration = "8h";
      } else {
        expectedDuration = "12h";
      }
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
    // if (!existLocation.instructors.includes(instructorId)) {
    //   return NextResponse.json(
    //     { error: "The instructor is not assigned to this location." },
    //     { status: 400 }
    //   );
    // }

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
    //   duration,
    //   instructorId
    // });

    // Function to check if two time ranges overlap
    const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
      const s1 = new Date(`2000-01-01T${start1}:00`);
      const e1 = new Date(`2000-01-01T${end1}:00`);
      const s2 = new Date(`2000-01-01T${start2}:00`);
      const e2 = new Date(`2000-01-01T${end2}:00`);
      return s1 < e2 && s2 < e1;
    };

    // Check for conflicts in TicketClass collection
    const existingTicketClasses = await TicketClass.find({
      date: normalizedDate,
      instructorId,
    });

    for (const existingClass of existingTicketClasses) {
      const existingEndHour = existingClass.endHour || 
        (() => {
          const startTime = new Date(`2000-01-01T${existingClass.hour}:00`);
          const durationHours = parseInt(existingClass.duration.replace('h', ''));
          const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
          return endTime.toTimeString().slice(0, 5);
        })();

      if (timeRangesOverlap(hour, calculatedEndHour, existingClass.hour, existingEndHour)) {
        return NextResponse.json(
          { 
            error: "The instructor already has a class scheduled that overlaps with this time.",
            details: {
              existingClass: {
                _id: existingClass._id,
                date: existingClass.date,
                startTime: existingClass.hour,
                endTime: existingEndHour,
                type: existingClass.type
              },
              attemptedClass: {
                date: normalizedDate,
                startTime: hour,
                endTime: calculatedEndHour,
                type
              }
            }
          },
          { status: 400 }
        );
      }
    }

    // Check for conflicts in instructor's schedule
    const instructor = await Instructor.findById(instructorId);
    if (instructor && instructor.schedule) {
      for (const slot of instructor.schedule) {
        // Only check slots that have a ticketClassId (active slots)
        if (slot.date === normalizedDate && slot.start && slot.end && slot.ticketClassId) {
          if (timeRangesOverlap(hour, calculatedEndHour, slot.start, slot.end)) {
            return NextResponse.json(
              { 
                error: "The instructor already has a schedule slot that overlaps with this time.",
                details: {
                  existingSlot: {
                    date: slot.date,
                    startTime: slot.start,
                    endTime: slot.end,
                    classType: slot.classType,
                    ticketClassId: slot.ticketClassId
                  },
                  attemptedClass: {
                    date: normalizedDate,
                    startTime: hour,
                    endTime: calculatedEndHour,
                    type
                  }
                }
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Check that students don't have another class at the same date and time
    if (students && students.length > 0) {
      const studentConflict = await TicketClass.findOne({
        date: normalizedDate,
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

    // Map class type for schedule
    const scheduleClassType = type === 'date' ? 'D.A.T.E' : 
                             type === 'bdi' ? 'B.D.I' : 
                             type === 'adi' ? 'A.D.I' : type;

    // Try to update existing slot in instructor's schedule with the ticketClassId
    const updateResult = await Instructor.updateOne(
      { 
        _id: instructorId,
        'schedule.date': normalizedDate,
        'schedule.start': hour,
        'schedule.end': calculatedEndHour
      },
      {
        $set: {
          'schedule.$.ticketClassId': newClass._id,
          'schedule.$.classType': scheduleClassType,
          'schedule.$.status': 'available'
        }
      }
    );

    // console.log('[API] Updated instructor slot with ticketClassId:', {
    //   instructorId,
    //   date: normalizedDate,
    //   hour,
    //   endHour: calculatedEndHour,
    //   ticketClassId: newClass._id,
    //   updateResult
    // });

    // If no existing slot was updated, create a new slot in the instructor's schedule
    if (updateResult.modifiedCount === 0) {
      // console.log('[API] No matching slot found, creating new slot in instructor schedule');
      
      await Instructor.updateOne(
        { _id: instructorId },
        {
          $push: {
            schedule: {
              date: normalizedDate,
              start: hour,
              end: calculatedEndHour,
              classType: scheduleClassType,
              ticketClassId: newClass._id,
              status: 'available',
              locationId: locationId,
              classId: classId,
              duration: duration,
              slotId: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
          }
        }
      );
      
      // console.log('[API] Created new slot in instructor schedule');
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
    const instructorId = req.nextUrl.searchParams.get("instructorId");
    let query = {};

    if (queryType) {
      query = { type: queryType };
    }
    
    if (instructorId) {
      query = { ...query, instructorId };
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


