// InstructorSchedule.tsx
// Componente contenedor para el calendario de instructores.
// Encapsula el título y el componente CalendarView.

import CalendarView from "./CalendarView";
import { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { CalendarEvent } from "./types";

interface InstructorScheduleProps {
  calendarKey: number;
  calendarEvents: CalendarEvent[];
  handleDateSelect: (selectInfo: DateSelectArg) => void;
  handleEventClick: (eventInfo: EventClickArg) => void;
}

const InstructorSchedule = ({
  calendarKey,
  calendarEvents,
  handleDateSelect,
  handleEventClick,
}: InstructorScheduleProps) => {
  return (
    <div className="h-full overflow-y-auto">
      <h3 className="text-lg font-semibold">Schedule</h3>
      <CalendarView
        calendarKey={calendarKey}
        calendarEvents={calendarEvents}
        handleDateSelect={handleDateSelect}
        handleEventClick={handleEventClick}
      />
    </div>
  );
};

export default InstructorSchedule; 