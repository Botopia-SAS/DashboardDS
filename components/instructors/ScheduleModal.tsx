// ScheduleModal.tsx
// Modal para crear o editar un slot en el calendario del instructor.

import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, SlotType } from "./types";
import { useState, useEffect } from "react";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlot: {
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    isEditing?: boolean;
    originalStart?: string;
    originalEnd?: string;
    studentId?: string;
    status?: "free" | "cancelled" | "scheduled";
  };
  setCurrentSlot: (slot: {
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    isEditing?: boolean;
    originalStart?: string;
    originalEnd?: string;
    studentId?: string;
    status?: "free" | "cancelled" | "scheduled";
  } | ((prev: {
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    isEditing?: boolean;
    originalStart?: string;
    originalEnd?: string;
    studentId?: string;
    status?: "free" | "cancelled" | "scheduled";
  }) => {
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    isEditing?: boolean;
    originalStart?: string;
    originalEnd?: string;
    studentId?: string;
    status?: "free" | "cancelled" | "scheduled";
  })) => void;
  handleSaveSlot: () => void;
  handleUpdateSlot: () => void;
  handleDeleteSlot: () => void;
  recurrenceOptions: string[];
  recurrenceEnd: string | null;
  setRecurrenceEnd: (date: string | null) => void;
  slotType: SlotType;
  setSlotType: (type: SlotType) => void;
  allUsers: User[];
  selectedStudent: string;
  setSelectedStudent: (id: string) => void;
}

// Time validation and helpers
function roundToNearest30(time: string, direction: 'up' | 'down' = 'down') {
  const [h, m] = time.split(":").map(Number);
  let minutes = h * 60 + m;
  if (direction === 'up') {
    minutes = Math.ceil(minutes / 30) * 30;
  } else {
    minutes = Math.floor(minutes / 30) * 30;
  }
  const newH = Math.floor(minutes / 60).toString().padStart(2, "0");
  const newM = (minutes % 60).toString().padStart(2, "0");
  return `${newH}:${newM}`;
}

const ScheduleModal = ({
  isOpen,
  onClose,
  currentSlot,
  setCurrentSlot,
  handleSaveSlot,
  handleUpdateSlot,
  handleDeleteSlot,
  recurrenceOptions,
  recurrenceEnd,
  setRecurrenceEnd,
  slotType,
  setSlotType,
  allUsers,
  selectedStudent,
  setSelectedStudent,
}: ScheduleModalProps) => {
  const [users, setUsers] = useState<User[]>(allUsers);

  const recurrenceLabel = currentSlot?.recurrence === "Daily"
    ? "every day"
    : currentSlot?.recurrence === "Weekly"
    ? "every week"
    : currentSlot?.recurrence === "Monthly"
    ? "every month"
    : "";

  const recurrenceSummary =
    currentSlot?.recurrence !== "None" && recurrenceEnd
      ? `A slot will be created ${recurrenceLabel} until ${recurrenceEnd}`
      : currentSlot?.recurrence !== "None"
      ? `A slot will be created ${recurrenceLabel}`
      : "";

  const startTime = currentSlot?.start ? currentSlot.start.split("T")[1].slice(0, 5) : "";
  const endTime = currentSlot?.end ? currentSlot.end.split("T")[1].slice(0, 5) : "";
  const timeError = startTime && endTime && endTime <= startTime;

  useEffect(() => {
    if (slotType === "booked") {
      setUsers(allUsers);
      if (currentSlot && currentSlot.studentId) {
        setSelectedStudent(currentSlot.studentId);
      }
    }
  }, [slotType, allUsers, currentSlot, setSelectedStudent]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mt-32">
        <h2 className="text-lg font-bold mb-4">
          Configure Schedule
          {currentSlot?.start && (
            <span className="block text-sm font-normal mt-1">
              {`Date: ${currentSlot.start.split("T")[0]}`}
            </span>
          )}
        </h2>

        <label className="block text-sm font-medium">Start Time</label>
        <Input
          type="time"
          value={startTime}
          step="1800"
          onChange={e => {
            const rounded = roundToNearest30(e.target.value, 'down');
            setCurrentSlot((prev: ScheduleModalProps["currentSlot"]) =>
              prev
                ? {
                    ...prev,
                    start: `${prev.start.split("T")[0]}T${rounded}`,
                    end: prev.end && prev.end.split("T")[1] <= rounded
                      ? `${prev.end.split("T")[0]}T${roundToNearest30(rounded, 'up')}`
                      : prev.end,
                  }
                : prev
            );
          }}
        />

        <label className="block text-sm font-medium mt-2">End Time</label>
        <Input
          type="time"
          value={endTime}
          step="1800"
          onChange={e => {
            const rounded = roundToNearest30(e.target.value, 'up');
            setCurrentSlot((prev: ScheduleModalProps["currentSlot"]) =>
              prev
                ? {
                    ...prev,
                    end: `${prev.end.split("T")[0]}T${rounded}`,
                  }
                : prev
            );
          }}
        />

        {timeError && (
          <div className="text-red-500 text-xs mt-1">End Time must be greater than Start Time and both must be multiples of 30 minutes.</div>
        )}

        <label className="block text-sm font-medium mt-2">Recurrence</label>
        <select
          className="w-full border rounded px-2 py-1"
          value={currentSlot?.recurrence || "None"}
          onChange={e =>
            setCurrentSlot((prev: ScheduleModalProps["currentSlot"]) =>
              prev ? { ...prev, recurrence: e.target.value } : prev
            )
          }
        >
          {recurrenceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {recurrenceSummary && (
          <div className="text-blue-600 text-xs mt-2">{recurrenceSummary}</div>
        )}

        {currentSlot?.recurrence !== "None" && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Recurrence End Date</label>
            <Input
              type="date"
              value={recurrenceEnd || ""}
              onChange={e => setRecurrenceEnd(e.target.value)}
              className="mt-2"
            />
          </div>
        )}

        <div className="mt-3 flex gap-4">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={slotType === "free"}
              onChange={() => { setSlotType("free"); }}
            />
            Free
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={slotType === "cancelled"}
              onChange={() => { setSlotType("cancelled"); }}
            />
            Cancelled
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={slotType === "booked"}
              onChange={() => { setSlotType("booked"); }}
            />
            Booked
          </label>
        </div>

        {slotType === "booked" && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Student</label>
            <input
              type="text"
              placeholder="Search student by name, email or ID..."
              onChange={(e) => {
                const value = e.target.value.toLowerCase();
                if (!value) {
                  setUsers(allUsers); // Muestra todos si el campo está vacío
                  return;
                }
                setUsers(
                  allUsers.filter(
                    (u) =>
                      ((u.name ||
                        `${u.firstName || ""} ${u.lastName || ""}`.trim()).toLowerCase().includes(value)
                      ) ||
                      (u.email && u.email.toLowerCase().includes(value)) ||
                      (u._id && u._id.toLowerCase().includes(value))
                  )
                );
              }}
              className="mb-2 w-full"
            />
            {users.length > 0 ? (
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full"
              >
                <option value="">Select a student</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {(user.name ||
                      `${user.firstName || ""} ${user.lastName || ""}`.trim())} {" "}
                    ({user.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500 w-full text-center">
                No students found
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-between">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>

          <Button onClick={currentSlot?.isEditing ? handleUpdateSlot : handleSaveSlot}>
            {currentSlot?.isEditing ? "Update" : "Save"}
          </Button>

          <Button onClick={handleDeleteSlot} variant="destructive">
            Delete
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ScheduleModal; 