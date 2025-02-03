import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoDB";
import OnlineCourse from "@/lib/models/OnlineCourse";

// ✅ GET ALL ONLINE COURSES
export async function GET() {
  try {
    await connectToDB();
    const courses = await OnlineCourse.find({});
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error("[GET_ONLINE_COURSES_ERROR]", error);
    return NextResponse.json({ message: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDB();
    const body = await req.json();

    console.log("📌 Recibido en backend:", body); // ← Verifica si la imagen llega

    const newCourse = new OnlineCourse({
      title: body.title,
      description: body.description,
      image: body.image || "", // ← Guardamos la imagen
      hasPrice: body.hasPrice,
      price: body.price ?? 0,
      type: body.type,
      buttonLabel: body.buttonLabel,
    });

    await newCourse.save();
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error("[POST_COURSE_ERROR]", error);
    return NextResponse.json({ message: "Failed to create online course" }, { status: 500 });
  }
}

// ✅ DELETE ONLINE COURSE
export async function DELETE(req: Request, { params }: { params: { id?: string } }) {
  try {
    await connectToDB();

    if (!params.id) {
      return NextResponse.json({ message: "Missing course ID" }, { status: 400 });
    }

    const deletedCourse = await OnlineCourse.findByIdAndDelete(params.id);

    if (!deletedCourse) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    console.log("✅ Course deleted:", deletedCourse);

    return NextResponse.json({ message: "Course deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE_COURSE_ERROR]", error);
    return NextResponse.json({ message: "Failed to delete course" }, { status: 500 });
  }
}