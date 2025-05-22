// CalendarView.tsx
// Componente presentacional para mostrar el calendario de FullCalendar.
// No contiene lógica de negocio, solo renderiza el calendario con las props recibidas.

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { CalendarEvent } from "./types";

interface CalendarViewProps {
  calendarKey: number;
  calendarEvents: CalendarEvent[];
  handleDateSelect: (selectInfo: DateSelectArg) => void;
  handleEventClick: (eventInfo: EventClickArg) => void;
}

const CalendarView = ({
  calendarKey,
  calendarEvents,
  handleDateSelect,
  handleEventClick,
}: CalendarViewProps) => (
  <FullCalendar
    key={calendarKey}
    plugins={[timeGridPlugin, interactionPlugin]}
    initialView="timeGridWeek"
    selectable
    editable
    slotMinTime="06:00:00"
    slotMaxTime="20:00:00"
    slotDuration="00:30:00"
    height="auto"
    contentHeight="auto"
    events={calendarEvents}
    select={handleDateSelect}
    eventClick={handleEventClick}
  />
);

export default CalendarView; 