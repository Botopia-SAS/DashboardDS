/**
 * Simplified and Responsive TicketCalendar Component
 * Refactored to be under 250 lines with better mobile support
 */

import { Card, CardContent } from "@/components/ui/card";
import { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { useState, useEffect } from "react";
import ScheduleModal from "./ScheduleModal";
import { TicketCalendarHeader } from "./TicketCalendarHeader";
import { TicketCalendarContent } from "./TicketCalendarContent";
import { useTicketCalendarData } from "./hooks/useTicketCalendarData";
import { highlightEventById } from "./utils/eventHighlighter";
import { deleteTicketClass, saveTicketClass } from "./utils/calendarActions";
import type { TicketClassResponse } from "./utils/calendarHelpers";

interface TicketFormData {
  _id?: string;
  date: string;
  hour: string;
  endHour: string;
  type: string;
  status: string;
  students: string[];
  spots: number;
  classId?: string;
  duration?: string;
  locationId?: string;
  studentRequests?: string[];
  recurrence?: string;
  recurrenceEndDate?: string;
}

interface TicketCalendarProps {
  className?: string;
  refreshKey?: number;
  classType?: string;
  focusClassId?: string | null;
  focusWeek?: number;
  focusYear?: number;
  highlightEventId?: string | null;
}

const TicketCalendar = ({
  className,
  refreshKey = 0,
  classType: propClassType,
  focusClassId,
  focusWeek,
  focusYear,
  highlightEventId
}: TicketCalendarProps) => {
  const classType = propClassType || "date";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TicketFormData | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  const {
    calendarEvents,
    classes,
    students,
    locations,
    isLoading,
    refreshCalendar
  } = useTicketCalendarData(classType, refreshKey);

  // Set default location
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0]._id);
    }
  }, [locations]);

  // Handle event highlighting from notifications
  useEffect(() => {
    const targetId = highlightEventId || focusClassId;
    if (targetId && calendarEvents.length > 0) {
      highlightEventById(targetId);
    }
  }, [highlightEventId, focusClassId, calendarEvents]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;

    setSelectedSlot({
      date: startDate.toISOString().split('T')[0],
      hour: startDate.toTimeString().slice(0, 5),
      endHour: endDate.toTimeString().slice(0, 5),
      type: classType,
      status: "available",
      students: [],
      spots: 30,
      classId: focusClassId || "",
      duration: "2h",
      locationId: selectedLocationId,
      studentRequests: [],
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (eventInfo: EventClickArg) => {
    const ticketClass = eventInfo.event.extendedProps.ticketClass as TicketClassResponse;
    if (ticketClass) {
      setSelectedSlot({
        _id: ticketClass._id,
        date: ticketClass.date?.slice(0, 10) || "",
        hour: ticketClass.hour || "",
        endHour: ticketClass.endHour || "",
        type: ticketClass.type || "date",
        status: ticketClass.status || "available",
        students: ticketClass.students || [],
        spots: ticketClass.spots || 30,
        classId: typeof ticketClass.classId === 'string'
          ? ticketClass.classId
          : ticketClass.classId?._id || "",
        duration: ticketClass.duration || "2h",
        locationId: typeof ticketClass.locationId === 'string'
          ? ticketClass.locationId
          : ticketClass.locationId?._id || "",
        studentRequests: ticketClass.studentRequests || [],
      });
      setIsModalOpen(true);
    }
  };

  const handleModalDelete = async (id: string) => {
    try {
      await deleteTicketClass(id);
      setIsModalOpen(false);
      await refreshCalendar();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleModalSave = async (data: TicketFormData) => {
    try {
      await saveTicketClass(data);
      setIsModalOpen(false);
      await refreshCalendar();
    } catch (error) {
      console.error('Error saving class:', error);
      throw error;
    }
  };

  return (
    <>
      <Card className={className}>
        <TicketCalendarHeader
          classType={classType}
          eventsCount={calendarEvents.length}
          locations={locations}
          selectedLocationId={selectedLocationId}
          onLocationChange={setSelectedLocationId}
        />
        <CardContent className="p-3 sm:p-6">
          <TicketCalendarContent
            events={calendarEvents}
            isLoading={isLoading}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            focusWeek={focusWeek}
            focusYear={focusYear}
            focusClassId={focusClassId}
          />
        </CardContent>
      </Card>

      {isModalOpen && selectedSlot && (
        <ScheduleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onUpdate={refreshCalendar}
          initialData={selectedSlot}
          locations={locations}
          classes={classes}
          students={students}
          selectedLocationId={selectedLocationId}
        />
      )}
    </>
  );
};

export default TicketCalendar;
