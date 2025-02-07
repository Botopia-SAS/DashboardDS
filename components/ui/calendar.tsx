"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface CalendarProps {
  onSelect: (date: Date) => void;
}

const Calendar = ({ onSelect }: CalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleDateSelect = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
      onSelect(date);
    }
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-md">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
      />
    </div>
  );
};

export default Calendar;
