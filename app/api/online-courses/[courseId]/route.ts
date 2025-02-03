import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import OnlineCourse from "@/lib/models/OnlineCourse";

// ✅ GET SINGLE ONLINE COURSE
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    // ✅ Extraer `courseId` desde `req.url`
    const url = new URL(req.url);
    const courseId = url.pathname.split("/").pop();

    if (!courseId) {
      return NextResponse.json({ message: "Course ID is required" }, { status: 400 });
    }

    const course = await OnlineCourse.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error("[GET_ONLINE_COURSE_ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch course" }, { status: 500 });
  }
}

// ✅ UPDATE COURSE
export async function PATCH(req: NextRequest) {
  try {
    await connectToDB();
    const body = await req.json();

    // ✅ Extraer `courseId` desde `req.url`
    const url = new URL(req.url);
    const courseId = url.pathname.split("/").pop();

    if (!courseId) {
      return NextResponse.json({ message: "Course ID is required" }, { status: 400 });
    }

    const updatedCourse = await OnlineCourse.findByIdAndUpdate(courseId, body, { new: true });
    if (!updatedCourse) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCourse, { status: 200 });
  } catch (error) {
    console.error("[PATCH_ONLINE_COURSE_ERROR]", error);
    return NextResponse.json({ message: "Failed to update course" }, { status: 500 });
  }
}

// ✅ DELETE A SINGLE ONLINE COURSE
export async function DELETE(req: NextRequest) {
  try {
    await connectToDB();

    // ✅ Extraer `courseId` desde `req.url`
    const url = new URL(req.url);
    const courseId = url.pathname.split("/").pop();

    if (!courseId) {
      return NextResponse.json({ message: "Course ID is required" }, { status: 400 });
    }

    console.log("📌 Intentando eliminar:", courseId);

    const deletedCourse = await OnlineCourse.findByIdAndDelete(courseId);
    if (!deletedCourse) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Online Course deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE_COURSE_ERROR]", error);
    return NextResponse.json({ message: "Failed to delete course" }, { status: 500 });
  }
}