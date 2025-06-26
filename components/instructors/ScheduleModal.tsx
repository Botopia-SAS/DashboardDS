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
    status?: "available" | "cancelled" | "scheduled";
    classType?: string;
    amount?: number;
    paid?: boolean;
    pickupLocation?: string;
    dropoffLocation?: string;
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
    status?: "available" | "cancelled" | "scheduled";
    classType?: string;
    amount?: number;
    paid?: boolean;
    pickupLocation?: string;
    dropoffLocation?: string;
  } | ((prev: {
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    isEditing?: boolean;
    originalStart?: string;
    originalEnd?: string;
    studentId?: string;
    status?: "available" | "cancelled" | "scheduled";
    classType?: string;
    amount?: number;
    paid?: boolean;
    pickupLocation?: string;
    dropoffLocation?: string;
  }) => {
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    isEditing?: boolean;
    originalStart?: string;
    originalEnd?: string;
    studentId?: string;
    status?: "available" | "cancelled" | "scheduled";
    classType?: string;
    amount?: number;
    paid?: boolean;
    pickupLocation?: string;
    dropoffLocation?: string;
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

// Reemplaza 'any' por el tipo correcto
// type CurrentSlotType = ScheduleModalProps['currentSlot'];
type CurrentSlotType = {
  start: string;
  end: string;
  booked: boolean;
  recurrence: string;
  isEditing?: boolean;
  originalStart?: string;
  originalEnd?: string;
  studentId?: string;
  status?: "available" | "cancelled" | "scheduled";
  classType?: string;
  amount?: number;
  paid?: boolean;
  pickupLocation?: string;
  dropoffLocation?: string;
};

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
  const [classTypeError, setClassTypeError] = useState<string>("");
  const [timeRangeError, setTimeRangeError] = useState<string>("");

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

  useEffect(() => {
    if (slotType === "booked") {
      setUsers(allUsers);
      if (currentSlot && currentSlot.studentId) {
        setSelectedStudent(currentSlot.studentId);
      }
    }
  }, [slotType, allUsers, currentSlot, setSelectedStudent]);

  // Ajusta automáticamente el End Time al abrir el modal si es menor a 2 horas después del Start Time
  useEffect(() => {
    if (!currentSlot.start) return;
    const start = currentSlot.start.split("T")[1];
    const end = currentSlot.end ? currentSlot.end.split("T")[1] : undefined;
    if (start && (!end || isLessThanTwoHours(start, end))) {
      // Calcula el end time sumando 2 horas
      const [h, m] = start.split(":").map(Number);
      let endHour = h + 2;
      let endMinute = m;
      if (endHour >= 24) { endHour = 23; endMinute = 59; }
      const endStr = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
      setCurrentSlot((prev: CurrentSlotType) => prev ? { ...prev, end: `${prev.start.split("T")[0]}T${endStr}` } : prev);
      setTimeRangeError("");
    } else if (start && end && isLessThanTwoHours(start, end)) {
      setTimeRangeError("The end time must be at least 2 hours after the start time.");
    } else {
      setTimeRangeError("");
    }
  }, [currentSlot.start, currentSlot.end, isOpen, setCurrentSlot]);

  function isLessThanTwoHours(start: string, end: string | undefined) {
    if (!end) return true;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    return endMinutes - startMinutes < 120;
  }

  // Sobrescribe el botón de guardar para validar classType
  const handleSaveWithClassType = () => {
    if (!currentSlot.classType) {
      setClassTypeError("Class type is required");
      return;
    }
    setClassTypeError("");
    handleSaveSlot();
  };
  const handleUpdateWithClassType = () => {
    if (!currentSlot.classType) {
      setClassTypeError("Class type is required");
      return;
    }
    setClassTypeError("");
    handleUpdateSlot();
  };

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

        <div className="mt-3">
          <label className="block text-sm font-medium">Class type <span className="text-red-500">*</span></label>
          <select
            className="w-full border rounded px-2 py-1"
            value={currentSlot.classType || ""}
            onChange={e => {
              setCurrentSlot((prev: CurrentSlotType) => prev ? { ...prev, classType: e.target.value } : prev);
              setClassTypeError("");
            }}
            required
          >
            <option value="">Select class type</option>
            <option value="D.A.T.E">D.A.T.E</option>
            <option value="B.D.I">B.D.I</option>
            <option value="A.D.I">A.D.I</option>
            <option value="driving test">Driving Test</option>
          </select>
          {classTypeError && <div className="text-red-500 text-xs mt-1">{classTypeError}</div>}
        </div>

        <label className="block text-sm font-medium mt-2">Start Time</label>
        <Input
          type="time"
          value={startTime}
          step="1800"
          onChange={e => {
            const rounded = roundToNearest30(e.target.value, 'down');
            // Calcula el end time sumando 2 horas
            const [h, m] = rounded.split(":").map(Number);
            let endHour = h + 2;
            let endMinute = m;
            if (endHour >= 24) { endHour = 23; endMinute = 59; }
            const endStr = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
            setCurrentSlot((prev: CurrentSlotType) => prev
              ? { ...prev, start: `${prev.start.split("T")[0]}T${rounded}`, end: `${prev.end.split("T")[0]}T${endStr}` }
              : prev
            );
          }}
        />

        <label className="block text-sm font-medium mt-2">End Time</label>
        <Input
          type="time"
          value={endTime}
          step="1800"
          min={(() => {
            if (!startTime) return undefined;
            const [h, m] = startTime.split(":").map(Number);
            let minHour = h + 2;
            let minMinute = m;
            if (minHour >= 24) { minHour = 23; minMinute = 59; }
            return `${minHour.toString().padStart(2, "0")}:${minMinute.toString().padStart(2, "0")}`;
          })()}
          onChange={e => {
            const rounded = roundToNearest30(e.target.value, 'up');
            setCurrentSlot((prev: CurrentSlotType) => prev
              ? { ...prev, end: `${prev.end.split("T")[0]}T${rounded}` }
              : prev
            );
          }}
        />

        {timeRangeError && <div className="text-red-500 text-xs mt-1">{timeRangeError}</div>}

        <label className="block text-sm font-medium mt-2">Recurrence</label>
        <select
          className="w-full border rounded px-2 py-1"
          value={currentSlot?.recurrence || "None"}
          onChange={e =>
            setCurrentSlot((prev: CurrentSlotType) =>
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
              checked={slotType === "available"}
              onChange={() => { setSlotType("available"); }}
            />
            Available
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

        {currentSlot.classType === "driving test" && (
          <div className="mt-3 space-y-2">
            <label className="block text-sm font-medium">Final amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <Input
                type="number"
                min="0"
                value={currentSlot.amount || ""}
                onChange={e => setCurrentSlot((prev: CurrentSlotType) => prev ? { ...prev, amount: Number(e.target.value) } : prev)}
                placeholder="Final amount"
                className="pl-7"
              />
            </div>
            {slotType === "booked" && (
              <>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!currentSlot.paid}
                    onChange={e => setCurrentSlot((prev: CurrentSlotType) => prev ? { ...prev, paid: e.target.checked } : prev)}
                  />
                  Paid?
                </label>
                <label className="block text-sm font-medium">Pickup location</label>
                <Input
                  type="text"
                  value={currentSlot.pickupLocation || ""}
                  onChange={e => setCurrentSlot((prev: CurrentSlotType) => prev ? { ...prev, pickupLocation: e.target.value } : prev)}
                  placeholder="Pickup location"
                />
                <label className="block text-sm font-medium">Dropoff location</label>
                <Input
                  type="text"
                  value={currentSlot.dropoffLocation || ""}
                  onChange={e => setCurrentSlot((prev: CurrentSlotType) => prev ? { ...prev, dropoffLocation: e.target.value } : prev)}
                  placeholder="Dropoff location"
                />
              </>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-between">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>

          <Button onClick={currentSlot?.isEditing ? handleUpdateWithClassType : handleSaveWithClassType} disabled={!!timeRangeError}>
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