/**
 * Header component for TicketCalendar
 */

import { CardHeader, CardTitle } from "@/components/ui/card";

interface TicketCalendarHeaderProps {
  classType: string;
  eventsCount: number;
  locations: { _id: string; title: string }[];
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
}

export const TicketCalendarHeader = ({
  classType,
  eventsCount,
  locations,
  selectedLocationId,
  onLocationChange
}: TicketCalendarHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <CardTitle className="text-base sm:text-lg">
            🗓️ {classType.toUpperCase()} Classes Calendar
          </CardTitle>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {eventsCount === 0
              ? `No ${classType.toUpperCase()} classes found`
              : `Showing ${eventsCount} ${classType.toUpperCase()} class${eventsCount !== 1 ? 'es' : ''}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-medium whitespace-nowrap">
            Location:
          </label>
          <select
            className="border rounded px-2 py-1 text-xs sm:text-sm min-w-[120px]"
            value={selectedLocationId}
            onChange={(e) => onLocationChange(e.target.value)}
          >
            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </CardHeader>
  );
};
