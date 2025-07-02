import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TicketClass from "@/lib/models/TicketClass";
import Instructor from "@/lib/models/Instructor";

// DELETE all ticket classes for an instructor
export async function DELETE(req: Request, { params }: { params: Promise<{ instructorId: string }> }) {
  try {
    await dbConnect();
    
    const { instructorId } = await params;
    
    console.log(`[API] DELETE /instructors/${instructorId}/ticket-classes - Deleting all ticket classes for instructor`);
    
    // Delete all ticket classes for this instructor
    const deleteResult = await TicketClass.deleteMany({ instructorId });
    
    console.log(`[API] Deleted ${deleteResult.deletedCount} ticket classes for instructor ${instructorId}`);
    
    // Also clean up the instructor's schedule to remove ticket class references
    const instructor = await Instructor.findById(instructorId);
    if (instructor && instructor.schedule) {
      // Keep only non-ticket class slots (like driving tests)
      const cleanedSchedule = instructor.schedule.filter((slot: any) => 
        !slot.ticketClassId && slot.classType === 'driving test'
      );
      
      await Instructor.findByIdAndUpdate(instructorId, {
        schedule: cleanedSchedule
      });
      
      console.log(`[API] Cleaned instructor schedule, kept ${cleanedSchedule.length} non-ticket slots`);
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
