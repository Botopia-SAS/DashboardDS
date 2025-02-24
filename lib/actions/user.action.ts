"use server";

import User from "@/lib/modals/user.modal";
import { connectToDB } from "@/lib/mongoDB";

export async function createUser(user: any) {
  try {
    await connectToDB();
    const newUser = await User.create(user);
    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}
