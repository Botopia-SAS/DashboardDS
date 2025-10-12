/**
 * Calendar content component with FullCalendar
 * Handles the rendering and event management for ticket calendar
 */

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg, EventClickArg, EventMountArg } from "@fullcalendar/core";
import type { TicketCalendarEvent } from "./utils/calendarHelpers";

interface TicketCalendarContentProps {
  events: TicketCalendarEvent[];
  isLoading: boolean;
  onDateSelect: (selectInfo: DateSelectArg) => void;
  onEventClick: (eventInfo: EventClickArg) => void;
  focusWeek?: number;
  focusYear?: number;
  focusClassId?: string | null;
}

export const TicketCalendarContent = ({
  events,
  isLoading,
  onDateSelect,
  onEventClick,
  focusWeek,
  focusYear,
  focusClassId
}: TicketCalendarContentProps) => {
  const handleEventDidMount = (info: EventMountArg) => {
    if (info.event.id) {
      info.el.setAttribute('data-event-id', info.event.id);
    }

    const event = info.event;
    const dateStr = event.start?.toISOString().split('T')[0] || '';
    const timeStr = event.start?.toTimeString().slice(0, 5).replace(':', '') || '';
    const slotId = `slot-${dateStr}-${timeStr}`;
    info.el.id = slotId;

    const titleEl = info.el.querySelector('.fc-event-title') ||
      info.el.querySelector('.fc-event-title-container') ||
      info.el.querySelector('.fc-event-main');

    if (titleEl) {
      const htmlTitleEl = titleEl as HTMLElement;
      htmlTitleEl.style.whiteSpace = 'pre-line';
      htmlTitleEl.style.overflow = 'visible';
      htmlTitleEl.style.textOverflow = 'clip';
      htmlTitleEl.style.fontSize = '10px';
      htmlTitleEl.style.lineHeight = '1.1';
      htmlTitleEl.style.padding = '2px';
      htmlTitleEl.style.wordWrap = 'break-word';
      htmlTitleEl.style.hyphens = 'auto';
    }

    info.el.style.cursor = 'pointer';
    info.el.style.transition = 'all 0.2s ease';

    const originalBg = info.el.style.backgroundColor;

    info.el.addEventListener('mouseenter', () => {
      info.el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      info.el.style.zIndex = '10';
    });

    info.el.addEventListener('mouseleave', () => {
      info.el.style.boxShadow = 'none';
      info.el.style.zIndex = '1';
      info.el.style.backgroundColor = originalBg;
    });
  };

  const getInitialDate = () => {
    if (focusClassId && focusWeek && focusYear) {
      const firstDayOfYear = new Date(focusYear, 0, 1);
      const firstWeekStart = new Date(firstDayOfYear);
      firstWeekStart.setDate(1 - firstDayOfYear.getDay());
      const targetDate = new Date(firstWeekStart);
      targetDate.setDate(firstWeekStart.getDate() + (focusWeek - 1) * 7);
      return targetDate;
    }
    return undefined;
  };

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">Loading classes...</p>
          </div>
        </div>
      ) : (
        <div className="
        calendar-container
        overflow-x-auto
        -mx-2 sm:mx-0
      ">
        <div className="min-w-[640px]">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            selectable
            editable={false}
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            slotDuration="00:30:00"
            height="auto"
            contentHeight="auto"
            aspectRatio={1.5}
            events={events}
            select={onDateSelect}
            eventMinHeight={45}
            eventShortHeight={35}
            eventClick={onEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            initialDate={getInitialDate()}
            eventDidMount={handleEventDidMount}
            eventDisplay="block"
            eventTextColor="#ffffff"
            eventBackgroundColor="#10b981"
            eventBorderColor="#059669"
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }}
            dayHeaderFormat={{
              weekday: 'short',
              month: 'numeric',
              day: 'numeric'
            }}
          />
        </div>
      </div>
      )}
    </div>
  );
};
