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
import { ArrowLeftIcon, MapPin, Users } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [selectedClassText, setSelectedClassText] = useState<string>("");
  const [showSelectClassModal, setShowSelectClassModal] = useState(false);
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
        // Decode URL parameter and normalize for comparison
        const decodedClassType = decodeURIComponent(classType).toLowerCase();
        
        const filteredClasses = data.filter((c: Class) => c.type.toLowerCase() === decodedClassType);
        setClasses(filteredClasses);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching classes:", error);
        setLoading(false);
      });
  }, [setClassId, classType]);
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
    router.back();
  };

  // Handler para cuando se selecciona una clase
  const handleClassSelect = (value: string) => {
    setClassId(value);

    // Encontrar la clase seleccionada y formatear el texto
    const selectedClass = classes.find(c => c._id === value);
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
        <Select onValueChange={handleClassSelect}>
          <SelectTrigger>
            <SelectValue
              placeholder={`Select a ${decodedClassType.toUpperCase()} class`}
            >
              {selectedClassText || `Select a ${decodedClassType.toUpperCase()} class`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white">
            {classes.length === 0 ? (
              <SelectItem value="no-classes" disabled>
                No {decodedClassType.toUpperCase()} classes available
              </SelectItem>
            ) : (
              classes.map((c) => {
                const studentCount = Array.isArray(c.students) ? c.students.length : 0;
                const totalSpots = c.spots || 30;
                const formatTime = (hour: string) => {
                  const [h, m] = hour.split(':');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <Navigation
                href={`/ticket/${classType}/certificate-editor`}
                title="Edit Certificate Design"
                description="Customize the certificate template for this class type."
              />
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
