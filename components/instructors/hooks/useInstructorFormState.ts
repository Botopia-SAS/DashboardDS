import { useState } from "react";
import { InstructorData, Slot, SlotType, User } from "../types";

export function useInstructorFormState(initialData?: InstructorData) {
  const recurrenceOptions = ["None", "Daily", "Weekly", "Monthly"];
  const [recurrenceEnd, setRecurrenceEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const scheduleDraftKey = initialData?._id ? `instructorScheduleDraft_${initialData._id}` : undefined;
  const [schedule, setSchedule] = useState<Slot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<any>({
    start: "",
    end: "",
    booked: false,
    recurrence: "None",
    status: undefined,
    recurrenceEnd: null,
    isEditing: false,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAll, setEditAll] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | string[]>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [availableSpots, setAvailableSpots] = useState<number>(30);
  const [slotType, setSlotType] = useState<SlotType>("");
  const [locations, setLocations] = useState<{ _id: string; title: string }[]>([]);
  
  // Estado para almacenar información de ticket classes cargada
  const [enrichedTicketData, setEnrichedTicketData] = useState<Record<string, any>>({});
  // Estado para almacenar todas las ticket classes del instructor
  const [allInstructorTicketClasses, setAllInstructorTicketClasses] = useState<any[]>([]);
  const [instructorTicketClassesLoaded, setInstructorTicketClassesLoaded] = useState(false);
  // Set de IDs de ticket classes que ya se han cargado en el estado
  const [loadedTicketClassIds, setLoadedTicketClassIds] = useState<Set<string>>(new Set());

  // Assigned locations logic (top-level, not inside any function)
  const assignedLocationIds = Array.isArray(initialData?.locationIds)
    ? initialData.locationIds
    : null;
  const filteredLocations = assignedLocationIds
    ? locations.filter((loc) => assignedLocationIds.includes(loc._id))
    : locations;

  return {
    // State variables
    recurrenceOptions,
    recurrenceEnd,
    setRecurrenceEnd,
    loading,
    setLoading,
    loadingSchedule,
    setLoadingSchedule,
    savingChanges,
    setSavingChanges,
    hasChanges,
    setHasChanges,
    scheduleDraftKey,
    schedule,
    setSchedule,
    isModalOpen,
    setIsModalOpen,
    currentSlot,
    setCurrentSlot,
    editModalOpen,
    setEditModalOpen,
    editAll,
    setEditAll,
    allUsers,
    setAllUsers,
    selectedStudent,
    setSelectedStudent,
    selectedStudents,
    setSelectedStudents,
    availableSpots,
    setAvailableSpots,
    slotType,
    setSlotType,
    locations,
    setLocations,
    enrichedTicketData,
    setEnrichedTicketData,
    allInstructorTicketClasses,
    setAllInstructorTicketClasses,
    instructorTicketClassesLoaded,
    setInstructorTicketClassesLoaded,
    loadedTicketClassIds,
    setLoadedTicketClassIds,
    
    // Computed values
    assignedLocationIds,
    filteredLocations,
  };
} 