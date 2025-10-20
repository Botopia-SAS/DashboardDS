/**
 * Script to seed sample session checklist data
 *
 * This script creates a sample checklist based on the provided MongoDB document.
 * Run with: npx tsx scripts/seed-checklist.ts
 */

import mongoose from "mongoose";
import SessionChecklist from "../lib/models/SessionChecklist";
import { connectToDB } from "../lib/mongoDB";

async function seedChecklist() {
  try {
    await connectToDB();
    console.log("✅ Connected to MongoDB");

    // Sample data from the provided document
    const sampleChecklist = {
      checklistType: "Driving Skills Basics",
      sessionId: new mongoose.Types.ObjectId("68f58435e194274374cc5832"),
      studentId: new mongoose.Types.ObjectId("67dda5ac448d12032b5d7a71"),
      instructorId: new mongoose.Types.ObjectId("68c9b231d7584ae078455b26"),
      items: [
        {
          name: "Seat & Headrest Adjustment",
          completed: false,
          rating: 8,
          comments: "asdasd",
          tally: 0,
        },
        {
          name: "Starting Car",
          completed: false,
          rating: 3,
          comments: "asdasdad",
          tally: 0,
        },
        {
          name: "Mirror Adjustment",
          completed: false,
          rating: 7,
          comments: "asdasdasd",
          tally: 0,
        },
        {
          name: "Vehicle's Controls",
          completed: false,
          rating: 6,
          comments: "asdasd",
          tally: 0,
        },
        {
          name: "Acceleration",
          completed: false,
          rating: 8,
          comments: "asdasdasd",
          tally: 0,
        },
        {
          name: "Braking",
          completed: false,
          rating: 8,
          comments: "asdasdasd",
          tally: 0,
        },
        {
          name: "Steering Pull Push",
          completed: false,
          rating: 4,
          comments: "asdasd",
          tally: 0,
        },
        {
          name: "Scanning",
          completed: false,
          rating: 4,
          comments: "asdasd",
          tally: 0,
        },
        {
          name: "Blind Spots",
          completed: false,
          rating: 8,
          comments: "asdasd",
          tally: 0,
        },
        {
          name: "Judgement",
          completed: false,
          rating: 8,
          comments: "asdasda",
          tally: 0,
        },
        {
          name: "Hand Over Hand Steering",
          completed: false,
          comments: "asdasd",
          tally: 0,
        },
        {
          name: "Merging",
          completed: false,
          rating: 6,
          comments: "asdasd",
          tally: 0,
        },
        {
          name: "Traffic Driving",
          completed: false,
          rating: 7,
          comments: "asdasdasd",
          tally: 0,
        },
        {
          name: "motorway driving",
          completed: false,
          rating: 5,
          comments: "asdasdas",
          tally: 0,
        },
        {
          name: "U Turns",
          completed: false,
          rating: 4,
          comments: "asdasdasdas",
          tally: 0,
        },
        {
          name: "Hill Starts",
          completed: false,
          rating: 8,
          comments: "asdasdasd",
          tally: 0,
        },
        {
          name: "Turn Around Manouvre",
          completed: false,
          rating: 10,
          comments: "asdasdasdasd",
          tally: 0,
        },
      ],
      notes: [
        {
          text: "sdasdasdas",
          date: new Date("2025-10-20T01:40:40.364Z"),
        },
      ],
      status: "in_progress",
      createdAt: new Date("2025-10-20T00:37:17.014Z"),
      updatedAt: new Date("2025-10-20T01:40:41.085Z"),
    };

    // Check if checklist already exists
    const existing = await SessionChecklist.findOne({
      sessionId: sampleChecklist.sessionId,
    });

    if (existing) {
      console.log("⚠️  Checklist already exists for this session");
      console.log("Existing checklist ID:", existing._id);
      return;
    }

    // Create new checklist
    const newChecklist = new SessionChecklist(sampleChecklist);
    await newChecklist.save();

    console.log("✅ Successfully created sample checklist");
    console.log("Checklist ID:", newChecklist._id);
    console.log("Student ID:", newChecklist.studentId);
    console.log("Instructor ID:", newChecklist.instructorId);
    console.log("Items count:", newChecklist.items.length);
  } catch (error) {
    console.error("❌ Error seeding checklist:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedChecklist();
