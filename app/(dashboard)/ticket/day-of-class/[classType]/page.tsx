"use client";

import useClassStore from "@/app/store/classStore";
import Loader from "@/components/custom ui/Loader";
import Navigation from "@/components/ticket/navigation-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftIcon, MapPin, Users, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useRouter, useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Helper function to normalize class type for comparison (same as calendar)
const normalizeClassType = (type: string): string => {
  return type.toLowerCase().trim().replace(/\s+/g, '-');
};

interface Class {
  _id: string;
  locationId: string | { _id: string; title: string };
  date: string;
  hour: string;
  endHour?: string;
  classId: string | { _id: string; title: string };
  instructorId: string | { _id: string; name: string };
  students: string[];
  type: string;
  spots: number;
  status: string;
  __v: number;
  locationName?: string;
}

export default function Page() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClassText, setSelectedClassText] = useState<string>("");
  const [showSelectClassModal, setShowSelectClassModal] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({ from: undefined, to: undefined });
  const [classNameFilter, setClassNameFilter] = useState<string>("all");
  const [leftMonth, setLeftMonth] = useState<Date>(new Date());
  const [rightMonth, setRightMonth] = useState<Date>(() => {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next;
  });
  const { setClassId, classId } = useClassStore();
  const router = useRouter();
  const params = useParams();
  const classType = params.classType as string;
  const decodedClassType = decodeURIComponent(classType);

  useEffect(() => {
    setLoading(true);
    setClassId("");
    setSelectedClassText(""); // Reset selected text when class type changes
    // Fetch classes from the calendar API to get populated data
    fetch(`/api/ticket/calendar`)
      .then((res) => res.json())
      .then((data) => {
        // Decode URL parameter and normalize for comparison using the same logic as calendar
        const decodedClassType = decodeURIComponent(classType);
        const normalizedClassType = normalizeClassType(decodedClassType);

        console.log('🔍 Day of Class - Filtering classes:');
        console.log('  - URL classType:', classType);
        console.log('  - Decoded classType:', decodedClassType);
        console.log('  - Normalized classType:', normalizedClassType);
        console.log('  - Total classes from API:', data.length);
        console.log('  - Sample class types:', data.slice(0, 5).map((c: Class) => ({ type: c.type, normalized: normalizeClassType(c.type) })));

        const filteredClasses = data.filter((c: Class) => {
          const normalizedTicketType = normalizeClassType(c.type);
          const matches = normalizedTicketType === normalizedClassType;

          if (matches) {
            const className = typeof c.classId === 'object' ? c.classId?.title : 'Unknown';
            console.log(`✅ Class matched: "${className}" (type: "${c.type}" → "${normalizedTicketType}") matches "${normalizedClassType}"`);
          } else {
            console.log(`❌ Class not matched: "${c.type}" → "${normalizedTicketType}" does not match "${normalizedClassType}"`);
          }

          return matches;
        });

        console.log('  - Filtered classes count:', filteredClasses.length);
        setClasses(filteredClasses);
        setFilteredClasses(filteredClasses);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching classes:", error);
        setLoading(false);
      });
  }, [setClassId, classType]);

  // Apply filters whenever dateRange, classNameFilter, or classes change
  useEffect(() => {
    let filtered = [...classes];

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter((c) => {
        const classDate = new Date(c.date);
        classDate.setHours(0, 0, 0, 0);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);

        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(0, 0, 0, 0);
          return classDate >= fromDate && classDate <= toDate;
        } else {
          // Si solo hay fecha de inicio, filtrar por esa fecha exacta
          return classDate.getTime() === fromDate.getTime();
        }
      });
    }

    // Apply class name filter
    if (classNameFilter !== "all") {
      filtered = filtered.filter((c) => getClassName(c) === classNameFilter);
    }

    setFilteredClasses(filtered);
  }, [dateRange, classNameFilter, classes]);
  if (loading) {
    return <Loader />;
  }
  const handleClick = (e: React.MouseEvent) => {
    if (classId === "") {
      e.preventDefault();
      setShowSelectClassModal(true);
    }
  };
  const navigate = () => {
    // Navigate specifically to the correct classtype page instead of using router.back()
    const normalizedClassType = classType.toLowerCase().replace(/\s+/g, '-');
    router.push(`/ticket/${normalizedClassType}`);
  };

  // Handler para cuando se selecciona una clase
  const handleClassSelect = (value: string) => {
    setClassId(value);

    // Encontrar la clase seleccionada y formatear el texto
    const selectedClass = filteredClasses.find(c => c._id === value);
    if (selectedClass) {
      const studentCount = Array.isArray(selectedClass.students) ? selectedClass.students.length : 0;
      const totalSpots = selectedClass.spots || 30;
      const formatTime = (hour: string) => {
        const [h] = hour.split(':');
        const hourNum = parseInt(h);
        return hourNum > 11 ? `${hour} PM` : `${hour} AM`;
      };

      const formattedText = `${getClassName(selectedClass)} - ${new Date(selectedClass.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      })} at ${formatTime(selectedClass.hour)} (${studentCount}/${totalSpots})`;

      setSelectedClassText(formattedText);
    }
  };

  // Helper function to get class name
  const getClassName = (c: Class) => {
    if (typeof c.classId === 'object' && c.classId.title) {
      return c.classId.title;
    }
    return `${decodedClassType.toUpperCase()} Class`;
  };

  // Helper function to get location name
  const getLocationName = (c: Class) => {
    if (typeof c.locationId === 'object' && c.locationId.title) {
      return c.locationId.title;
    }
    return c.locationName || 'Unknown Location';
  };

  // Funciones para navegar los meses
  const handleLeftMonthPrev = () => {
    const newMonth = new Date(leftMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setLeftMonth(newMonth);
  };

  const handleLeftMonthNext = () => {
    const newMonth = new Date(leftMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);

    // Asegurar que el mes izquierdo sea siempre menor que el derecho (no pueden ser iguales)
    if (newMonth.getFullYear() < rightMonth.getFullYear() ||
      (newMonth.getFullYear() === rightMonth.getFullYear() && newMonth.getMonth() < rightMonth.getMonth())) {
      setLeftMonth(newMonth);
    }
  };

  const handleRightMonthPrev = () => {
    const newMonth = new Date(rightMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);

    // Asegurar que el mes derecho sea siempre mayor que el izquierdo (no pueden ser iguales)
    if (newMonth.getFullYear() > leftMonth.getFullYear() ||
      (newMonth.getFullYear() === leftMonth.getFullYear() && newMonth.getMonth() > leftMonth.getMonth())) {
      setRightMonth(newMonth);
    }
  };

  const handleRightMonthNext = () => {
    const newMonth = new Date(rightMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setRightMonth(newMonth);
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center bg-gray-800 text-white px-5 py-3 rounded-lg shadow-md">
          <h1 className="text-xl font-semibold">
            {decodedClassType.toUpperCase()} Classes - Day of Class
          </h1>
          <Button onClick={navigate} className="hover:scale-110">
            <ArrowLeftIcon size={16} />
          </Button>
        </div>
      </div>
      <div className="p-6">
        {/* Filters Section */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <div className="flex">
                  {/* Left Calendar */}
                  <div className="border-r">
                    <div className="flex items-center justify-between p-3 border-b">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLeftMonthPrev}
                        className="h-7 w-7"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="font-semibold">
                        {format(leftMonth, "MMMM yyyy")}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLeftMonthNext}
                        className="h-7 w-7"
                        disabled={
                          leftMonth.getFullYear() === rightMonth.getFullYear() &&
                          leftMonth.getMonth() >= rightMonth.getMonth()
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="[&_.rdp-caption]:hidden [&_.rdp-nav]:hidden">
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                        month={leftMonth}
                        onMonthChange={setLeftMonth}
                        className="p-3"
                        numberOfMonths={1}
                      />
                    </div>
                  </div>

                  {/* Right Calendar */}
                  <div>
                    <div className="flex items-center justify-between p-3 border-b">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRightMonthPrev}
                        className="h-7 w-7"
                        disabled={
                          rightMonth.getFullYear() === leftMonth.getFullYear() &&
                          rightMonth.getMonth() <= leftMonth.getMonth()
                        }
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="font-semibold">
                        {format(rightMonth, "MMMM yyyy")}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRightMonthNext}
                        className="h-7 w-7"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="[&_.rdp-caption]:hidden [&_.rdp-nav]:hidden">
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                        month={rightMonth}
                        onMonthChange={setRightMonth}
                        className="p-3"
                        numberOfMonths={1}
                      />
                    </div>
                  </div>
                </div>
                {dateRange.from && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setDateRange({ from: undefined, to: undefined })}
                    >
                      Clear filter
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Class Name
            </label>
            <Select value={classNameFilter} onValueChange={setClassNameFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Classes</SelectItem>
                {Array.from(new Set(classes.map(c => getClassName(c)))).map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Class Selection Dropdown */}
        <Select onValueChange={handleClassSelect}>
          <SelectTrigger>
            <SelectValue
              placeholder={`Select a ${decodedClassType.toUpperCase()} class`}
            >
              {selectedClassText || `Select a ${decodedClassType.toUpperCase()} class`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white">
            {filteredClasses.length === 0 ? (
              <SelectItem value="no-classes" disabled>
                No {decodedClassType.toUpperCase()} classes available
              </SelectItem>
            ) : (
              filteredClasses.map((c) => {
                const studentCount = Array.isArray(c.students) ? c.students.length : 0;
                const totalSpots = c.spots || 30;
                const formatTime = (hour: string) => {
                  const [h] = hour.split(':');
                  const hourNum = parseInt(h);
                  return hourNum > 11 ? `${hour} PM` : `${hour} AM`;
                };

                return (
                  <SelectItem
                    key={c?._id}
                    value={c?._id}
                    className="hover:bg-gray-100 cursor-pointer p-3"
                  >
                    <div className="w-full">
                      <div className="font-medium text-gray-900 mb-1">
                        {getClassName(c)}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {new Date(c?.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })} at {formatTime(c?.hour)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        {getLocationName(c)} |
                        <Users className="w-3 h-3 text-gray-500 ml-1" />
                        {studentCount}/{totalSpots} students
                      </div>
                    </div>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
        <Card className="mt-4">
          <CardContent>
            <div className="grid grid-cols-1 gap-4 py-2">
              <Navigation
                href={`/ticket/${classType}/class-records/${classId}`}
                title="View the Class Records"
                description="View the records of the selected class."
                onClick={handleClick}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Select Class Modal */}
      <Dialog open={showSelectClassModal} onOpenChange={setShowSelectClassModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Select Class
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Please select a class before proceeding to view the class records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowSelectClassModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
