"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type ClassTabType = "traffic-school" | "driving-test" | "driving-lesson";

interface ClassHistoryProps {
  customerId: string;
}

const ClassHistory = ({ customerId }: ClassHistoryProps) => {
  const [activeSubTab, setActiveSubTab] = useState<ClassTabType>("traffic-school");

  const subTabs = [
    { id: "traffic-school" as ClassTabType, label: "Traffic School" },
    { id: "driving-test" as ClassTabType, label: "Driving Test" },
    { id: "driving-lesson" as ClassTabType, label: "Driving Lesson" },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6" aria-label="Class Type Tabs">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeSubTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {activeSubTab === "traffic-school" && (
          <TrafficSchoolHistory customerId={customerId} />
        )}
        {activeSubTab === "driving-test" && (
          <DrivingTestHistory customerId={customerId} />
        )}
        {activeSubTab === "driving-lesson" && (
          <DrivingLessonHistory customerId={customerId} />
        )}
      </div>
    </div>
  );
};

// Traffic School History Component
const TrafficSchoolHistory = ({ customerId }: { customerId: string }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}/classes`);
        if (!res.ok) throw new Error("Failed to fetch classes");
        const data = await res.json();

        // Filter only traffic school classes (type: "date")
        const trafficSchoolClasses = data.filter(
          (cls: any) => cls.type === "date" || cls.type === "traffic-school"
        );
        setClasses(trafficSchoolClasses);
      } catch (err) {
        console.error("Error fetching traffic school classes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Traffic School</h3>
      {classes.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No classes found for this customer.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {classes.map((cls) => (
                <tr key={cls._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {cls.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.locationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(cls.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.hour} - {cls.endHour}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cls.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={cn(
                        "px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent",
                        cls.status === "available"
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : cls.status === "cancel"
                          ? "border-red-500 text-red-600 dark:text-red-400"
                          : cls.status === "full"
                          ? "border-yellow-500 text-yellow-600 dark:text-yellow-400"
                          : "border-gray-400 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {cls.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Driving Test History Component
const DrivingTestHistory = ({ customerId }: { customerId: string }) => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}/driving-tests`);
        if (!res.ok) throw new Error("Failed to fetch driving tests");
        const data = await res.json();
        setTests(data);
      } catch (err) {
        console.error("Error fetching driving tests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Driving Test</h3>
      {tests.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No driving tests found for this customer.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tests.map((test) => (
                <tr key={test._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {test.instructorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(test.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {test.startTime} - {test.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${test.amount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={cn(
                        "px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent",
                        test.paid
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : "border-yellow-500 text-yellow-600 dark:text-yellow-400"
                      )}
                    >
                      {test.paid ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={cn(
                        "px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent",
                        test.status === "available"
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : test.status === "cancelled"
                          ? "border-red-500 text-red-600 dark:text-red-400"
                          : test.status === "booked"
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-gray-400 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {test.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Driving Lesson History Component
const DrivingLessonHistory = ({ customerId }: { customerId: string }) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}/driving-lessons`);
        if (!res.ok) throw new Error("Failed to fetch driving lessons");
        const data = await res.json();
        setLessons(data);
      } catch (err) {
        console.error("Error fetching driving lessons:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Driving Lesson</h3>
      {lessons.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No driving lessons found for this customer.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pickup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dropoff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {lessons.map((lesson) => (
                <tr key={lesson._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {lesson.instructorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(lesson.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {lesson.startTime} - {lesson.endTime}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {lesson.pickupLocation || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {lesson.dropoffLocation || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {lesson.selectedProduct || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${lesson.amount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={cn(
                        "px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent",
                        lesson.paid
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : "border-yellow-500 text-yellow-600 dark:text-yellow-400"
                      )}
                    >
                      {lesson.paid ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={cn(
                        "px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent",
                        lesson.status === "available"
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : lesson.status === "cancelled"
                          ? "border-red-500 text-red-600 dark:text-red-400"
                          : lesson.status === "booked"
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-gray-400 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {lesson.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClassHistory;
