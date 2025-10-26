import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TicketClass from "@/lib/models/TicketClass";
import Instructor from "@/lib/models/Instructor";

// DELETE all ticket classes for an instructor
export async function DELETE(req: Request, { params }: { params: Promise<{ instructorId: string }> }) {
  try {
    await dbConnect();
    
    const { instructorId } = await params;
    

    // Delete all ticket classes for this instructor
    const deleteResult = await TicketClass.deleteMany({ instructorId });
    

    // Also clean up the instructor's schedule to remove ticket class references
    const instructor = await Instructor.findById(instructorId);
    if (instructor) {
      // Clean up schedule_driving_test if it exists
      if (instructor.schedule_driving_test) {
        const cleanedDrivingTestSchedule = instructor.schedule_driving_test.filter((slot: any) => 
          !slot.ticketClassId && slot.classType === 'driving test'
        );
        
        await Instructor.findByIdAndUpdate(instructorId, {
          schedule_driving_test: cleanedDrivingTestSchedule
        });
        

      }
      
      // Clean up schedule_driving_lesson if it exists
      if (instructor.schedule_driving_lesson) {
        const cleanedDrivingLessonSchedule = instructor.schedule_driving_lesson.filter((slot: any) => 
          !slot.ticketClassId && slot.classType === 'driving lesson'
        );
        
        await Instructor.findByIdAndUpdate(instructorId, {
          schedule_driving_lesson: cleanedDrivingLessonSchedule
        });
        

      }
    }
    
    return NextResponse.json({ 
      message: `Successfully deleted ${deleteResult.deletedCount} ticket classes`,
      deletedCount: deleteResult.deletedCount
    });
    
  } catch (error: any) {
    console.error("[API] Error deleting instructor ticket classes:", error);
    return NextResponse.json(
      { error: error.message || "Error deleting ticket classes" },
      { status: 500 }
    );
  }
}
