"use server";

import User from "@/lib/models/User";
import { connectToDB } from "@/lib/mongoDB";
export type UserType = {
  clerkId: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export async function createUser(user: UserType) {
  try {
    await connectToDB();
    const newUser = await User.create(user);
    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}
