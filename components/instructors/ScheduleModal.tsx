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
    status?: "available" | "cancelled" | "scheduled" | "full";
    classType?: string;
    amount?: number;
    paid?: boolean;
    pickupLocation?: string;
    dropoffLocation?: string;
    classId?: string;
    duration?: string;
    locationId?: string;
    cupos?: number;
    students?: string[];
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
    status?: "available" | "cancelled" | "scheduled" | "full";
    classType?: string;
    amount?: number;
    paid?: boolean;
    pickupLocation?: string;
    dropoffLocation?: string;
    classId?: string;
    duration?: string;
    locationId?: string;
    cupos?: number;
    students?: string[];
  } | ((prev: {
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    isEditing?: boolean;
    originalStart?: string;
    originalEnd?: string;
    studentId?: string;
    status?: "available" | "cancelled" | "scheduled" | "full";
    classType?: string;
    amount?: number;
    paid?: boolean;
    pickupLocation?: string;
    dropoffLocation?: string;
    classId?: string;
    duration?: string;
    locationId?: string;
    cupos?: number;
    students?: string[];
  }) => {
    start: string;
    end: string;
    booked: boolean;
    recurrence: string;
    isEditing?: boolean;
    originalStart?: string;
    originalEnd?: string;
    studentId?: string;
    status?: "available" | "cancelled" | "scheduled" | "full";
    classType?: string;
    amount?: number;
    paid?: boolean;
    pickupLocation?: string;
    dropoffLocation?: string;
    classId?: string;
    duration?: string;
    locationId?: string;
    cupos?: number;
    students?: string[];
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
  selectedStudent: string | string[];
  setSelectedStudent: (id: string | string[]) => void;
  selectedStudents: string[];
  setSelectedStudents: (ids: string[]) => void;
  availableSpots: number;
  setAvailableSpots: (spots: number) => void;
  locations: { _id: string; title: string }[];
}

// Time validation and helpers
function convertTo24HourFormat(time: string): string {
  // Si ya está en formato 24 horas (HH:MM), retornarlo tal como está
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
    return time;
  }
  
  // Si tiene AM/PM, convertir a 24 horas
  const timePattern = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = time.match(timePattern);
  
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'AM' && hours === 12) {
      hours = 0;
    } else if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // Si no coincide con ningún patrón, retornar tal como está
  return time;
}

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
  status?: "available" | "cancelled" | "scheduled" | "full";
  classType?: string;
  amount?: number;
  paid?: boolean;
  pickupLocation?: string;
  dropoffLocation?: string;
  classId?: string;
  duration?: string;
  locationId?: string;
  cupos?: number;
  students?: string[];
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
  selectedStudents,
  setSelectedStudents,
  availableSpots,
  setAvailableSpots,
  locations,
}: ScheduleModalProps) => {
  const [classTypeError, setClassTypeError] = useState<string>("");
  const [timeRangeError, setTimeRangeError] = useState<string>("");
  const [drivingClasses, setDrivingClasses] = useState<Array<{
    _id: string;
    title: string;
    price?: number;
    length?: number;
  }>>([]);
  const [locationError, setLocationError] = useState<string>("");

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
      if (currentSlot && currentSlot.studentId) {
        setSelectedStudent(currentSlot.studentId);
      }
    }
  }, [slotType, currentSlot, setSelectedStudent]);

  useEffect(() => {
    if (isOpen && currentSlot.classType && currentSlot.classType !== 'driving test') {
      //console.log("Loading driving classes for class type:", currentSlot.classType);
      fetch('/api/classes')
        .then(res => res.json())
        .then(data => {
          //console.log("Loaded driving classes:", data);
          setDrivingClasses(data);
        })
        .catch(error => console.error("Error loading driving classes:", error));
    }
  }, [isOpen, currentSlot.classType]);

  // Log para debuggear qué datos tiene currentSlot cuando se abre para editar
  useEffect(() => {
    if (isOpen && currentSlot.isEditing) {
      //console.log("Modal opened for editing with currentSlot:", currentSlot);
      //console.log("Selected students:", selectedStudents);
      //console.log("Available spots:", availableSpots);
      //console.log("Slot type:", slotType);
    }
  }, [isOpen, currentSlot.isEditing]);

  // Ajusta automáticamente el End Time al abrir el modal si es menor a 2 horas después del Start Time
  useEffect(() => {
    if (!currentSlot.start) return;
    const start = currentSlot.start.split("T")[1];
    const end = currentSlot.end ? currentSlot.end.split("T")[1] : undefined;
    
    // For driving test, allow flexible duration - no automatic 2-hour minimum
    if (currentSlot.classType === "driving test") {
      if (start && end && isLessThanMinimumDuration(start, end, 30)) { // 30 minutes minimum for driving test
        setTimeRangeError("The end time must be at least 30 minutes after the start time.");
      } else {
        setTimeRangeError("");
      }
      return;
    }
    
    // For other class types, maintain the original 2-hour logic
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
  }, [currentSlot.start, currentSlot.end, currentSlot.classType, isOpen, setCurrentSlot]);

  function isLessThanTwoHours(start: string, end: string | undefined) {
    if (!end) return true;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    return endMinutes - startMinutes < 120;
  }

  function isLessThanMinimumDuration(start: string, end: string | undefined, minimumMinutes: number) {
    if (!end) return true;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    return endMinutes - startMinutes < minimumMinutes;
  }

  // Sobrescribe el botón de guardar para validar classType
  const handleSaveWithClassType = () => {
    if (["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType || "") && !currentSlot.locationId) {
      setLocationError("Location is required");
      return;
    }
    setLocationError("");
    if (!currentSlot.classType) {
      setClassTypeError("Class type is required");
      return;
    }
    setClassTypeError("");
    
    // Validar que se haya seleccionado una clase para ticket classes
    if (["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType || "") && !currentSlot.classId) {
      setClassTypeError("Please select a driving class for this type of lesson");
      return;
    }
    
    handleSaveSlot();
  };
  const handleUpdateWithClassType = () => {
    if (["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType || "") && !currentSlot.locationId) {
      setLocationError("Location is required");
      return;
    }
    setLocationError("");
    if (!currentSlot.classType) {
      setClassTypeError("Class type is required");
      return;
    }
    setClassTypeError("");
    
    // Validar que se haya seleccionado una clase para ticket classes
    if (["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType || "") && !currentSlot.classId) {
      setClassTypeError("Please select a driving class for this type of lesson");
      return;
    }
    
    handleUpdateSlot();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mt-8">
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
              const newClassType = e.target.value;
              const previousClassType = currentSlot.classType;
              
              // Check if switching between ticket classes and driving test
              const isTicketClass = (type: string) => ["D.A.T.E", "B.D.I", "A.D.I"].includes(type);
              const wasTicketClass = isTicketClass(previousClassType || "");
              const isNowTicketClass = isTicketClass(newClassType);
              
              // Clear students if switching between different category types
              if (wasTicketClass !== isNowTicketClass) {
                setSelectedStudents([]);
                setSelectedStudent("");
              }
              
              setCurrentSlot((prev: CurrentSlotType) => prev ? { ...prev, classType: newClassType } : prev);
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

        {currentSlot.classType && currentSlot.classType !== 'driving test' && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Driving Class</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={currentSlot.classId || ''}
              onChange={e => {
                const selected = drivingClasses.find((c) => c._id === e.target.value);
                setCurrentSlot((prev) => prev ? {
                  ...prev,
                  classId: e.target.value,
                  amount: selected && typeof selected.price === 'number' ? selected.price : undefined,
                  duration: selected && typeof selected.length === 'number' ? `${selected.length}h` : '',
                } : prev);
              }}
              required
            >
              <option value="">Select a class</option>
              {drivingClasses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        {["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType || "") && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Location <span className="text-red-500">*</span></label>
            <select
              className="w-full border rounded px-2 py-1"
              value={currentSlot.locationId || ""}
              onChange={e => {
                setCurrentSlot((prev) => prev ? { ...prev, locationId: e.target.value } : prev);
                setLocationError("");
              }}
              required
            >
              <option value="">Select a location</option>
              {locations.map(loc => (
                <option key={loc._id} value={loc._id}>{loc.title}</option>
              ))}
            </select>
            {locationError && <div className="text-red-500 text-xs mt-1">{locationError}</div>}
          </div>
        )}

        <label className="block text-sm font-medium mt-2">Start Time</label>
        <Input
          type="time"
          value={startTime}
          step="1800"
          onChange={e => {
            const timeValue = convertTo24HourFormat(e.target.value);
            const rounded = roundToNearest30(timeValue, 'down');
            
            // For driving test, don't automatically set end time - let user choose
            if (currentSlot.classType === "driving test") {
              setCurrentSlot((prev: CurrentSlotType) => prev
                ? { ...prev, start: `${prev.start.split("T")[0]}T${rounded}` }
                : prev
              );
            } else {
              // For other class types, maintain original 2-hour auto-calculation
              const [h, m] = rounded.split(":").map(Number);
              let endHour = h + 2;
              let endMinute = m;
              if (endHour >= 24) { endHour = 23; endMinute = 59; }
              const endStr = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
              setCurrentSlot((prev: CurrentSlotType) => prev
                ? { ...prev, start: `${prev.start.split("T")[0]}T${rounded}`, end: `${prev.end.split("T")[0]}T${endStr}` }
                : prev
              );
            }
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
            
            // For driving test, minimum 30 minutes after start time
            if (currentSlot.classType === "driving test") {
              let minHour = h;
              let minMinute = m + 30;
              if (minMinute >= 60) {
                minHour += 1;
                minMinute -= 60;
              }
              if (minHour >= 24) { minHour = 23; minMinute = 59; }
              return `${minHour.toString().padStart(2, "0")}:${minMinute.toString().padStart(2, "0")}`;
            } else {
              // For other class types, maintain 2-hour minimum
              let minHour = h + 2;
              let minMinute = m;
              if (minHour >= 24) { minHour = 23; minMinute = 59; }
              return `${minHour.toString().padStart(2, "0")}:${minMinute.toString().padStart(2, "0")}`;
            }
          })()}
          onChange={e => {
            const timeValue = convertTo24HourFormat(e.target.value);
            const rounded = roundToNearest30(timeValue, 'up');
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
          {/* Only show Booked option for driving test classes */}
          {currentSlot.classType === "driving test" && (
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={slotType === "booked"}
                onChange={() => { setSlotType("booked"); }}
              />
              Booked
            </label>
          )}
          {["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType || "") && (
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={slotType === "full"}
                onChange={() => { setSlotType("full"); }}
              />
              Full
            </label>
          )}
        </div>

        {/* Campos específicos para ADI, BDI, DATE */}
        {["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType || "") && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium">Available Spots</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={availableSpots}
                onChange={e => setAvailableSpots(Number(e.target.value))}
                placeholder="Number of available spots"
              />
            </div>

            {(slotType === "available" || slotType === "full") && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Students ({selectedStudents.length}/{availableSpots})
                </label>
                <div className="border rounded p-3 bg-gray-50 h-24 overflow-y-auto">
                  {allUsers.length > 0 ? (
                    <div className="space-y-1">
                      {allUsers.map((user) => {
                        const isSelected = selectedStudents.includes(user._id);
                        const isDisabled = !isSelected && selectedStudents.length >= availableSpots;
                        
                        return (
                          <label 
                            key={user._id} 
                            className={`flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer transition-colors text-sm ${
                              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={(e) => {
                                let updated;
                                if (e.target.checked) {
                                  if (selectedStudents.length < availableSpots) {
                                    updated = [...selectedStudents, user._id];
                                  } else {
                                    return; // Prevent adding more than available spots
                                  }
                                } else {
                                  updated = selectedStudents.filter(id => id !== user._id);
                                }
                                
                                setSelectedStudents(updated);
                                
                                // Auto-set status based on capacity
                                if (updated.length >= availableSpots) {
                                  setSlotType("full");
                                } else if (slotType === "full" && updated.length < availableSpots) {
                                  setSlotType("available");
                                }
                              }}
                              className="w-3 h-3 text-blue-600 rounded focus:ring-1 focus:ring-blue-500 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-900 truncate">
                                {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {user.email}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No students available
                    </div>
                  )}
                </div>
                {selectedStudents.length >= availableSpots && (
                  <div className="text-xs text-blue-600 mt-1">
                    All spots are filled. Uncheck students to add others.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {slotType === "booked" && currentSlot.classType && currentSlot.classType !== 'driving test' && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Students</label>
            <select
              multiple
              className="w-full border rounded px-2 py-1"
              value={Array.isArray(selectedStudent) ? selectedStudent : [selectedStudent]}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedStudent(options);
              }}
            >
              {allUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim())} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {slotType === "booked" && currentSlot.classType === "driving test" && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Student</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
            >
              <option value="">Select a student</option>
              {allUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim())} ({user.email})
                </option>
              ))}
            </select>
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