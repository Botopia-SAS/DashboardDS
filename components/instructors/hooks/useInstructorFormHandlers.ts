import { Slot, SlotType, InstructorData, User } from "../types";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { getSlotStatus, generateRecurringDates } from "./useInstructorFormHelpers";
import { convertTo24HourFormat } from "../utils";
import { toValidClassType, mapClassTypeForBackend } from "../instructorFormUtils";
import { EventClickArg } from "@fullcalendar/core";

type UseInstructorFormHandlersParams = {
  schedule: Slot[];
  setSchedule: React.Dispatch<React.SetStateAction<Slot[]>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentSlot: React.Dispatch<React.SetStateAction<any>>;
  setSelectedStudent: React.Dispatch<React.SetStateAction<string | string[]>>;
  setSelectedStudents: React.Dispatch<React.SetStateAction<string[]>>;
  setAvailableSpots: React.Dispatch<React.SetStateAction<number>>;
  setSlotType: React.Dispatch<React.SetStateAction<SlotType>>;
  setRecurrenceEnd: React.Dispatch<React.SetStateAction<string | null>>;
  assignedLocationIds: string[] | null;
  selectedStudent: string | string[];
  selectedStudents: string[];
  availableSpots: number;
  slotType: SlotType;
  currentSlot: any;
  recurrenceEnd: string | null;
  initialData: InstructorData | undefined;
  enrichedTicketData: Record<string, any>;
  setEnrichedTicketData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  loadedTicketClassIds: Set<string>;
  setLoadedTicketClassIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  allInstructorTicketClasses: any[];
  setAllInstructorTicketClasses: React.Dispatch<React.SetStateAction<any[]>>;
  instructorTicketClassesLoaded: boolean;
  checkTimeOverlap: (slot: Slot, existingSlots: Slot[]) => { overlaps: boolean, overlappingSlot?: Slot };
};

export function useInstructorFormHandlers({
  schedule,
  setSchedule,
  setIsModalOpen,
  setCurrentSlot,
  setSelectedStudent,
  setSelectedStudents,
  setAvailableSpots,
  setSlotType,
  setRecurrenceEnd,
  assignedLocationIds,
  selectedStudent,
  selectedStudents,
  availableSpots,
  slotType,
  currentSlot,
  recurrenceEnd,
  initialData,
  enrichedTicketData,
  setEnrichedTicketData,
  loadedTicketClassIds,
  setLoadedTicketClassIds,
  allInstructorTicketClasses,
  setAllInstructorTicketClasses,
  instructorTicketClassesLoaded,
  checkTimeOverlap,
}: UseInstructorFormHandlersParams) {

  const handleDateSelect = (selectInfo: { startStr: string; endStr: string }) => {
    const start = selectInfo.startStr;
    let end = selectInfo.endStr;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    
    if (durationMinutes < 30) {
      const defaultEndDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      end = defaultEndDate.toISOString();
    }
    
    setCurrentSlot({ start, end, booked: false, recurrence: "None" });
    setSelectedStudents([]);
    setSelectedStudent("");
    setAvailableSpots(30);
    setSlotType("");
    setIsModalOpen(true);
  };

  const handleDeleteSlot = async () => {
    if (!currentSlot) {
      console.warn('[DELETE] No current slot to delete');
      return;
    }
    
    try {
      console.log('[DELETE] Starting deletion process for slot:', {
        slotId: currentSlot.slotId,
        ticketClassId: currentSlot.ticketClassId,
        date: currentSlot.start.split("T")[0],
        start: currentSlot.start.split("T")[1],
        end: currentSlot.end.split("T")[1]
      });
      
      setSchedule((prevSchedule: Slot[]) =>
        prevSchedule.filter((slot: Slot) => {
          if (currentSlot.slotId && slot.slotId === currentSlot.slotId) return false;
          if (currentSlot.ticketClassId && slot.ticketClassId === currentSlot.ticketClassId) return false;
          if (
            !currentSlot.slotId && !currentSlot.ticketClassId &&
            slot.date === currentSlot.start.split("T")[0] &&
            slot.start === currentSlot.start.split("T")[1] &&
            slot.end === currentSlot.end.split("T")[1]
          ) return false;
          return true;
        })
      );
      
      const modalCleanup = () => {
        setIsModalOpen(false);
        setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
        setSelectedStudent("");
        setSelectedStudents([]);
        setAvailableSpots(30);
      };
      
      setTimeout(modalCleanup, 0);
      
      console.log('[DELETE] Visual deletion completed successfully');
      toast.success("Slot deleted! Remember to press 'Save Changes' to save to the database.");
      
    } catch (error) {
      console.error('[DELETE] Error during visual deletion:', error);
      toast.error("Error deleting slot. Please try again.");
      
      setIsModalOpen(false);
      setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
      setSelectedStudent("");
      setSelectedStudents([]);
      setAvailableSpots(30);
    }
  };

  const handleUpdateSlot = async () => {
    if (!currentSlot) {
      toast.error("No slot defined.");
      return;
    }
    
    const date = currentSlot.start.split("T")[0];
    const startTime = currentSlot.start.split("T")[1];
    const endTime = currentSlot.end.split("T")[1];
    
    const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType);
    
    const tempSlot: Slot = {
      date,
      start: startTime, 
      end: endTime,
      classType: toValidClassType(currentSlot.classType),
      ticketClassId: currentSlot.ticketClassId
    };
    
    const otherSlots = schedule.filter(slot => {
      if (currentSlot.ticketClassId) {
        return slot.ticketClassId !== currentSlot.ticketClassId;
      }
      return slot.slotId !== currentSlot.originalSlotId;
    });
    
    const { overlaps, overlappingSlot } = checkTimeOverlap(tempSlot, otherSlots);
    
    if (overlaps) {
      console.error('[UPDATE] Time overlap detected:', { 
        new: { date, start: startTime, end: endTime },
        existing: overlappingSlot 
      });
      
      toast.error(`Error: Ya existe una clase programada de ${overlappingSlot?.start || 'inicio'} a ${overlappingSlot?.end || 'fin'} en esta fecha.`);
      return;
    }
    
    setSchedule((prevSchedule: Slot[]) => {
      const filtered = prevSchedule.filter(slot => slot.slotId !== currentSlot.originalSlotId);
      const newSlotId = uuidv4();
      
      // Find the original slot to get the original ticketClassId
      const originalSlot = schedule.find(s => s.slotId === currentSlot.originalSlotId);
      const originalTicketClassId = originalSlot?.ticketClassId || currentSlot.ticketClassId;
      
      console.log('[UPDATE] Preserving ticket class ID:', {
        originalSlotId: currentSlot.originalSlotId,
        fromOriginalSlot: originalSlot?.ticketClassId,
        fromCurrentSlot: currentSlot.ticketClassId,
        willUse: originalTicketClassId,
        isTicketClass
      });
      
      const newSlot = {
        ...currentSlot,
        date,
        start: startTime,
        end: endTime,
        booked: !isTicketClass && slotType === "booked",
        studentId: !isTicketClass && slotType === "booked" ? selectedStudent : null,
        status: getSlotStatus(slotType, isTicketClass),
        recurrence: currentSlot.recurrence,
        slotId: newSlotId,
        classType: toValidClassType(currentSlot.classType),
        amount: currentSlot.amount,
        paid: currentSlot.paid,
        pickupLocation: currentSlot.pickupLocation,
        dropoffLocation: currentSlot.dropoffLocation,
        locationId: currentSlot.locationId,
        duration: currentSlot.duration,
        classId: currentSlot.classId,
        ticketClassId: originalTicketClassId,
        students: isTicketClass ? selectedStudents : undefined,
        cupos: isTicketClass ? availableSpots : undefined,
        // Add metadata to help with diff matching
        originalTicketClassId: originalTicketClassId,
        originalSlotId: currentSlot.originalSlotId,
      };
      
      if (isTicketClass && newSlot.ticketClassId) {
        setEnrichedTicketData(prev => ({
          ...prev,
          [newSlot.ticketClassId!]: {
            students: selectedStudents,
            cupos: availableSpots,
            classId: currentSlot.classId,
            locationId: currentSlot.locationId,
            amount: currentSlot.amount,
            duration: currentSlot.duration ? parseInt(currentSlot.duration.replace('h', '')) : undefined,
          }
        }));
      }
      
      return [...filtered, newSlot];
    });
    
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    toast.success(
      "Slot updated! Remember to press 'Save Changes' to save to the database."
    );
  };

  const handleSaveSlot = async () => {
    if (!currentSlot) {
      toast.error("No slot defined.");
      return;
    }
    
    console.log('[SAVE_SLOT] currentSlot:', currentSlot);
    
    if (!slotType) {
      toast.error("Please select a slot type.");
      return;
    }
    
    const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(currentSlot.classType);
    
    if (isTicketClass) {
      if (!currentSlot.classId) {
        toast.error("Please select a driving class for this type of lesson.");
        return;
      }
      
      if (!currentSlot.locationId) {
        toast.error("Please select a location for this class.");
        return;
      }
      
      if (!availableSpots || availableSpots <= 0) {
        toast.error("Please enter the number of available spots.");
        return;
      }
      
      if (!["available", "cancelled", "full"].includes(slotType)) {
        toast.error("Please select a valid status for this class type.");
        return;
      }
      
      if (slotType === "available" && selectedStudents.length > availableSpots) {
        toast.error(`Cannot add more students than available spots (${availableSpots}).`);
        return;
      }
      
      if (selectedStudents.length >= availableSpots) {
        setSlotType("full");
      }
    } else {
      if (slotType === "booked" && !selectedStudent) {
        toast.error("Please select a student for a booked slot.");
        return;
      }
    }
    
    if (assignedLocationIds && currentSlot.locationId && !assignedLocationIds.includes(currentSlot.locationId)) {
      toast.error("You must assign the instructor to this location before adding a class here.");
      return;
    }
    
    if (currentSlot.recurrence !== "None" && !recurrenceEnd) {
      toast.error("Please select an end date for the recurring slot.");
      return;
    }
    
    let locationId = currentSlot.locationId;
    if (locationId && typeof locationId === 'object' && '_id' in locationId) {
      locationId = (locationId as any)._id;
    }
    if (locationId && typeof locationId !== 'string') {
      locationId = String(locationId);
    }
    
    const startDate = currentSlot.start.split("T")[0];
    const recurringDates = generateRecurringDates(startDate, currentSlot.recurrence, recurrenceEnd);
    
    console.log("Generating recurring slots:", { 
      startDate, 
      recurrence: currentSlot.recurrence, 
      endDate: recurrenceEnd, 
      dates: recurringDates 
    });
    
    if (currentSlot.classType === "driving test") {
      const allNewSlots: Slot[] = [];
      
      for (const date of recurringDates) {
        const rawStartTime = currentSlot.start.split("T")[1];
        const rawEndTime = currentSlot.end.split("T")[1];
        
        const startTime = convertTo24HourFormat(rawStartTime);
        const endTime = convertTo24HourFormat(rawEndTime);
        
        console.log('[SAVE_SLOT] Driving test time conversion:', { 
          date, rawStartTime, rawEndTime, startTime, endTime 
        });
        
        const newSlot: Slot = {
          date,
          start: startTime,
          end: endTime,
          booked: slotType === "booked",
          studentId: slotType === "booked" ? selectedStudent : null,
          status: getSlotStatus(slotType, false),
          classType: currentSlot.classType,
          amount: currentSlot.amount,
          paid: currentSlot.paid,
          pickupLocation: currentSlot.pickupLocation,
          dropoffLocation: currentSlot.dropoffLocation,
          slotId: uuidv4(),
          locationId,
        };
        
        allNewSlots.push(newSlot);
      }
      
      for (const slot of allNewSlots) {
        if (
          schedule.some(
            (s: Slot) =>
              s.date === slot.date && s.start === slot.start && s.end === slot.end
          )
        ) {
          toast.error(`Slot already exists for ${slot.date} at ${slot.start}-${slot.end}.`);
          return;
        }
      }
      
      setSchedule((prevSchedule: Slot[]) => [...prevSchedule, ...allNewSlots]);
      setIsModalOpen(false);
      setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
      setSelectedStudent("");
      setSlotType("");
      setRecurrenceEnd(null);
      toast.success(`${allNewSlots.length} slots saved for ${recurringDates.length} dates!`);
      return;
    }      
    
    const allNewSlots: Slot[] = [];
    const rawStart = currentSlot.start.split("T")[1].slice(0, 5);
    const rawEnd = currentSlot.end.split("T")[1].slice(0, 5);
    
    const newStart = convertTo24HourFormat(rawStart);
    const newEnd = convertTo24HourFormat(rawEnd);
    
    console.log('[SAVE_SLOT] Time conversion:', { rawStart, rawEnd, newStart, newEnd });
    
    for (const date of recurringDates) {
      const tempSlot: Slot = {
        date,
        start: newStart,
        end: newEnd,
        status: getSlotStatus(slotType, isTicketClass),
        classType: toValidClassType(currentSlot.classType),
      };
      
      const { overlaps, overlappingSlot } = checkTimeOverlap(tempSlot, schedule);
      
      if (overlaps) {
        console.error('[SAVE_SLOT] Time overlap detected:', { 
          new: { date, start: newStart, end: newEnd },
          existing: overlappingSlot 
        });
        
        toast.error(`Error: Ya existe una clase programada de ${overlappingSlot?.start || 'inicio'} a ${overlappingSlot?.end || 'fin'} en esta fecha.`);
        return;
      }
    }
    
    for (const date of recurringDates) {
      let tempId: string | undefined = undefined;
      
      if (isTicketClass) {
        tempId = `temp-${date}-${newStart}-${uuidv4()}`;
        console.log(`[SAVE_SLOT] Creating independent temporary ticket class slot with ID: ${tempId}`);
      }
      
      const newSlot: Slot = {
        status: getSlotStatus(slotType, isTicketClass),
        cupos: isTicketClass ? availableSpots : 30,
        date: date,
        start: newStart,
        end: newEnd,
        classType: toValidClassType(currentSlot.classType),
        classId: currentSlot.classId,
        duration: currentSlot.duration,
        locationId: locationId,
        amount: currentSlot.amount,
        paid: currentSlot.paid,
        pickupLocation: currentSlot.pickupLocation,
        dropoffLocation: currentSlot.dropoffLocation,
        students: isTicketClass ? selectedStudents : undefined,
        slotId: uuidv4(),
        booked: !isTicketClass && slotType === "booked",
        studentId: !isTicketClass && slotType === "booked" ? selectedStudent : null,
        ticketClassId: isTicketClass ? tempId : undefined,
        isTemporary: isTicketClass ? true : undefined,
        createdAsRecurrence: currentSlot.recurrence !== "None",
        originalRecurrenceGroup: currentSlot.recurrence !== "None" ? uuidv4() : undefined
      };
      
      allNewSlots.push(newSlot);
      
      if (isTicketClass && tempId) {
        const tempTicketData = {
          students: selectedStudents || [],
          cupos: availableSpots || 30,
          classId: currentSlot.classId,
          locationId: locationId,
          amount: currentSlot.amount,
          duration: currentSlot.duration ? parseInt(String(currentSlot.duration).replace('h', '')) : 4,
          type: mapClassTypeForBackend(toValidClassType(currentSlot.classType)),
          date: date,
          hour: newStart,
          endHour: newEnd,
          isTemporary: true,
          createdAsRecurrence: currentSlot.recurrence !== "None"
        };
        
        setEnrichedTicketData(prev => ({
          ...prev,
          [tempId]: tempTicketData
        }));
        
        console.log(`[SAVE_SLOT] Added independent temporary ticket class data to cache: ${tempId}`);
      }
    }
    
    setSchedule((prevSchedule: Slot[]) => [...prevSchedule, ...allNewSlots]);
    
    if (isTicketClass) {
      const ticketDataUpdate = {
        students: selectedStudents,
        cupos: availableSpots,
        classId: currentSlot.classId,
        locationId: currentSlot.locationId,
        amount: currentSlot.amount,
        duration: currentSlot.duration ? parseInt(String(currentSlot.duration).replace('h', '')) : undefined,
      };
      
      setEnrichedTicketData(prev => {
        const updated = { ...prev };
        allNewSlots.forEach(slot => {
          if (slot.ticketClassId) {
            updated[slot.ticketClassId] = ticketDataUpdate;
          }
        });
        return updated;
      });
    }
    
    setIsModalOpen(false);
    setCurrentSlot({ start: "", end: "", booked: false, recurrence: "None" });
    setSelectedStudent("");
    setSelectedStudents([]);
    setAvailableSpots(30);
    setSlotType("");
    setRecurrenceEnd(null);
    
    const hasTicketClasses = allNewSlots.some((slot: Slot) => isTicketClass && slot.isTemporary);
    if (hasTicketClasses) {
      toast.success(`${allNewSlots.length} classes added to schedule! Click 'Save Changes' to create them in the database.`);
    } else {
      toast.success(`${allNewSlots.length} slots saved for ${recurringDates.length} dates! Remember to press 'Save Changes' to save to the database.`);
    }
  };

  const handleEventClick = async (eventInfo: EventClickArg) => {
    const { start, end, extendedProps } = eventInfo.event;
    if (!start || !end) {
      return;
    }
    let realSlot: Slot | undefined;
    if (extendedProps && extendedProps.slotId) {
      realSlot = schedule.find((s: Slot) => s.slotId === extendedProps.slotId);
    }
    if (!realSlot) {
      const formattedStart = start.toISOString().split("T")[0] + "T" + start.toTimeString().slice(0, 5);
      const formattedEnd = end.toISOString().split("T")[0] + "T" + end.toTimeString().slice(0, 5);
      realSlot = schedule.find(
        (s: Slot) =>
          s.date === formattedStart.split("T")[0] &&
          s.start === formattedStart.split("T")[1] &&
          s.end === formattedEnd.split("T")[1]
      );
    }

    if (realSlot && realSlot.ticketClassId) {
      const cachedData = enrichedTicketData[realSlot.ticketClassId];
      
      if (cachedData && loadedTicketClassIds.has(realSlot.ticketClassId)) {
        console.log("Using cached ticket class data for editing:", realSlot.ticketClassId);
        
        const classType = realSlot.classType || 'D.A.T.E';

                  setCurrentSlot({
            start: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            end: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            booked: realSlot.booked || false,
            recurrence: realSlot.recurrence || "None",
            isEditing: true,
            originalStart: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            originalEnd: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            slotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            originalSlotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            studentId: Array.isArray(realSlot.studentId)
              ? (realSlot.studentId[0] || "")
              : (realSlot.studentId || ""),
            status: realSlot.status,
            classType: classType,
            classId: cachedData.classId || realSlot.classId,
            amount: cachedData.amount || realSlot.amount,
            duration: cachedData.duration ? `${cachedData.duration}h` : (realSlot.duration || ''),
            paid: realSlot.paid,
            pickupLocation: realSlot.pickupLocation,
            dropoffLocation: realSlot.dropoffLocation,
            locationId: cachedData.locationId || realSlot.locationId,
            cupos: cachedData.cupos || 30,
            students: cachedData.students || [],
            ticketClassId: realSlot.ticketClassId,
          });
        
        const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(classType);
        if (isTicketClass) {
          const cuposValue = cachedData.cupos || 30;
          const studentsValue = cachedData.students || [];
          
          setAvailableSpots(cuposValue);
          setSelectedStudents(studentsValue);
          
          const studentCount = studentsValue.length;
          if (studentCount >= cuposValue) {
            setSlotType("full");
          } else if (realSlot.status === "cancelled") {
            setSlotType("cancelled");
          } else {
            setSlotType("available");
          }
        }
        
        setSelectedStudent(realSlot.status === "scheduled" && realSlot.studentId ? realSlot.studentId : "");
        setIsModalOpen(true);
        return;
      }
      
      if (realSlot.ticketClassId.startsWith('temp-')) {
        console.log("Editing temporary ticket class (using cached data only):", realSlot.ticketClassId);
        
        const cachedData = enrichedTicketData[realSlot.ticketClassId];
        
        if (cachedData) {
          const classType = realSlot.classType || 'D.A.T.E';

          setCurrentSlot({
            start: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            end: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            booked: realSlot.booked || false,
            recurrence: realSlot.recurrence || "None",
            isEditing: true,
            originalStart: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            originalEnd: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            slotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            originalSlotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            studentId: Array.isArray(realSlot.studentId)
              ? (realSlot.studentId[0] || "")
              : (realSlot.studentId || ""),
            status: realSlot.status,
            classType: classType,
            classId: cachedData.classId || realSlot.classId,
            amount: cachedData.amount || realSlot.amount,
            duration: cachedData.duration ? `${cachedData.duration}h` : (realSlot.duration || ''),
            paid: realSlot.paid,
            pickupLocation: realSlot.pickupLocation,
            dropoffLocation: realSlot.dropoffLocation,
            locationId: cachedData.locationId || realSlot.locationId,
            cupos: cachedData.cupos || 30,
            students: cachedData.students || [],
            ticketClassId: realSlot.ticketClassId
          });
          
          const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(classType);
          if (isTicketClass) {
            const cuposValue = cachedData.cupos || 30;
            const studentsValue = cachedData.students || [];
            
            setAvailableSpots(cuposValue);
            setSelectedStudents(studentsValue);
            
            const studentCount = studentsValue.length;
            if (studentCount >= cuposValue) {
              setSlotType("full");
            } else if (realSlot.status === "cancelled") {
              setSlotType("cancelled");
            } else {
              setSlotType("available");
            }
          }
          
          setSelectedStudent(realSlot.status === "scheduled" && realSlot.studentId ? realSlot.studentId : "");
          setIsModalOpen(true);
          return;
        } else {
          console.warn("No cached data found for temporary ticket class:", realSlot.ticketClassId);
          const classType = realSlot.classType || 'D.A.T.E';
          
          setCurrentSlot({
            start: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            end: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            booked: realSlot.booked || false,
            recurrence: realSlot.recurrence || "None",
            isEditing: true,
            originalStart: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            originalEnd: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            slotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            originalSlotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            studentId: Array.isArray(realSlot.studentId)
              ? (realSlot.studentId[0] || "")
              : (realSlot.studentId || ""),
            status: realSlot.status,
            classType: classType,
            classId: realSlot.classId,
            amount: realSlot.amount,
            duration: realSlot.duration || '',
            paid: realSlot.paid,
            pickupLocation: realSlot.pickupLocation,
            dropoffLocation: realSlot.dropoffLocation,
            locationId: realSlot.locationId,
            cupos: realSlot.cupos || 30,
            students: realSlot.students || [],
            ticketClassId: realSlot.ticketClassId
          });
          
          const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(classType);
          if (isTicketClass) {
            setAvailableSpots(realSlot.cupos || 30);
            setSelectedStudents(realSlot.students || []);
            
            const studentCount = (realSlot.students || []).length;
            const totalSpots = realSlot.cupos || 30;
            if (studentCount >= totalSpots) {
              setSlotType("full");
            } else if (realSlot.status === "cancelled") {
              setSlotType("cancelled");
            } else {
              setSlotType("available");
            }
          }
          
          setSelectedStudent(realSlot.status === "scheduled" && realSlot.studentId ? realSlot.studentId : "");
          setIsModalOpen(true);
          return;
        }
      }
      
      try {
        console.log("Loading ticket class data from API (cache miss):", realSlot.ticketClassId);
        const res = await fetch(`/api/ticket/classes/${realSlot.ticketClassId}`);
        if (res.ok) {
          const ticket = await res.json();
          console.log("Loaded ticket class data for editing:", ticket);
          
          const ticketDataForCache = {
            students: ticket.students || [],
            cupos: ticket.cupos || 30,
            classId: ticket.classId,
            locationId: ticket.locationId,
            amount: ticket.price,
            duration: ticket.duration,
          };
          setEnrichedTicketData(prev => ({
            ...prev,
            [realSlot.ticketClassId!]: ticketDataForCache
          }));
          setLoadedTicketClassIds(prev => new Set([...prev, realSlot.ticketClassId!]));
          
          const classType = ticket.type === 'date' ? 'D.A.T.E' : 
                           ticket.type === 'bdi' ? 'B.D.I' : 
                           ticket.type === 'adi' ? 'A.D.I' : 
                           ticket.type;

          setCurrentSlot({
            start: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            end: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            booked: realSlot.booked || false,
            recurrence: realSlot.recurrence || "None",
            isEditing: true,
            originalStart: realSlot.start ? `${realSlot.date}T${realSlot.start}` : "",
            originalEnd: realSlot.end ? `${realSlot.date}T${realSlot.end}` : "",
            slotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            originalSlotId: realSlot.slotId || realSlot.ticketClassId || uuidv4(),
            studentId: Array.isArray(realSlot.studentId)
              ? (realSlot.studentId[0] || "")
              : (realSlot.studentId || ""),
            status: realSlot.status,
            classType: classType,
            classId: ticket.classId,
            amount: ticket.price || realSlot.amount,
            duration: ticket.duration ? `${ticket.duration}h` : '',
            paid: realSlot.paid,
            pickupLocation: realSlot.pickupLocation,
            dropoffLocation: realSlot.dropoffLocation,
            locationId: ticket.locationId,
            cupos: ticket.cupos || realSlot.cupos || 30,
            students: ticket.students || [],
            ticketClassId: realSlot.ticketClassId,
          });
          
          const isTicketClass = ["date", "bdi", "adi"].includes(ticket.type);
          if (isTicketClass) {
            const cuposValue = ticket.cupos || realSlot.cupos || 30;
            const studentsValue = ticket.students || [];
            
            setAvailableSpots(cuposValue);
            setSelectedStudents(studentsValue);
            
            setEnrichedTicketData(prev => ({
              ...prev,
              [realSlot.ticketClassId!]: {
                students: studentsValue,
                cupos: cuposValue,
                classId: ticket.classId,
                locationId: ticket.locationId,
                amount: ticket.price,
                duration: ticket.duration,
              }
            }));
            
            console.log("Setting ticket class data:", {
              cupos: cuposValue,
              students: studentsValue,
              studentCount: studentsValue.length
            });
            
            const studentCount = studentsValue.length;
            if (studentCount >= cuposValue) {
              setSlotType("full");
            } else if (realSlot.status === "cancelled") {
              setSlotType("cancelled");
            } else {
              setSlotType("available");
            }
          } else {
            setSlotType(realSlot.status === "scheduled" ? "booked" : realSlot.status === "cancelled" ? "cancelled" : "available");
          }
          
          setSelectedStudent(realSlot.status === "scheduled" && realSlot.studentId ? realSlot.studentId : "");
          setIsModalOpen(true);
          return;
        }
      } catch (error) {
        console.error("Error loading ticket class data:", error);
      }
    }
    
    setCurrentSlot({
      start: realSlot?.start ? `${realSlot.date}T${realSlot.start}` : "",
      end: realSlot?.end ? `${realSlot.date}T${realSlot.end}` : "",
      booked: realSlot?.booked || false,
      recurrence: realSlot?.recurrence || "None",
      isEditing: true,
      originalStart: realSlot?.start ? `${realSlot.date}T${realSlot.start}` : "",
      originalEnd: realSlot?.end ? `${realSlot.date}T${realSlot.end}` : "",
      slotId: realSlot?.slotId || uuidv4(),
      originalSlotId: realSlot?.slotId || uuidv4(),
      studentId: Array.isArray(realSlot?.studentId)
        ? (realSlot?.studentId[0] || "")
        : (realSlot?.studentId || ""),
      status: realSlot?.status,
      classType: realSlot?.classType,
      classId: realSlot?.classId,
      amount: realSlot?.amount,
      duration: realSlot?.duration,
      paid: realSlot?.paid,
      pickupLocation: realSlot?.pickupLocation,
      dropoffLocation: realSlot?.dropoffLocation,
      locationId: realSlot?.locationId,
      cupos: realSlot?.cupos,
      students: realSlot?.students || [],
      ticketClassId: realSlot?.ticketClassId,
    });
    
    const isTicketClass = ["D.A.T.E", "B.D.I", "A.D.I"].includes(realSlot?.classType || "");
    if (isTicketClass) {
      setAvailableSpots(realSlot?.cupos || 30);
      setSelectedStudents(realSlot?.students || []);
      const studentCount = (realSlot?.students || []).length;
      const totalSpots = realSlot?.cupos || 30;
      if (studentCount >= totalSpots) {
        setSlotType("full");
      } else if (realSlot?.status === "cancelled") {
        setSlotType("cancelled");
      } else {
        setSlotType("available");
      }
    } else {
      if (realSlot?.status === "scheduled") setSlotType("booked");
      else if (realSlot?.status === "cancelled") setSlotType("cancelled");
      else setSlotType("available");
    }
    
    if (realSlot?.status === "scheduled" && realSlot?.studentId) {
      setSelectedStudent(realSlot.studentId);
    } else {
      setSelectedStudent("");
    }
    setIsModalOpen(true);
  };

  return {
    handleSaveSlot,
    handleUpdateSlot,
    handleDeleteSlot,
    handleDateSelect,
    handleEventClick,
  };
} 