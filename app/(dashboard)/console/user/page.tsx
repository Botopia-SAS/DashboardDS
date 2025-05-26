"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ChangeUserRole() {
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/updateRole", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email, // Using email instead of user ID
          newRole,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Role successfully updated: ${newRole}`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage("❌ Error connecting to the server");
      console.error(error);
    }
  };

  return (
    <div className="bg-white p-6 shadow-md rounded-lg max-w-xl mx-auto">
      <div className="flex items-center mb-4">
        <Link href="/console">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Console
          </Button>
        </Link>
        <h2 className="text-2xl font-bold flex-1 text-center text-gray-800 mb-0">
          Change User Role
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User Email Input */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            User Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Example: user@example.com"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring focus:ring-blue-400"
            required
          />
        </div>

        {/* Role Selector */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            New Role:
          </label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring focus:ring-blue-400"
            required
          >
            <option value="">Select a role</option>
            <option value="lens_admin">Administrator</option>
            <option value="teacher_admin">Teacher</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Change Role
        </button>
      </form>

      {/* Status Message */}
      {message && (
        <p className="mt-4 text-center font-medium text-gray-700">{message}</p>
      )}
    </div>
  );
}
