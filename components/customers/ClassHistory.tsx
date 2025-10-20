"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type ClassTabType = "traffic-school" | "driving-test" | "driving-lesson";

interface ClassHistoryProps {
  customerId: string;
}

interface ChecklistItem {
  name: string;
  completed: boolean;
  rating?: number;
  comments?: string;
  tally?: number;
}

interface ChecklistNote {
  text: string;
  date: string;
}

interface SessionChecklistData {
  _id: string;
  checklistType: string;
  sessionId: string;
  studentId: string;
  instructorId: string;
  instructorName: string;
  instructorEmail?: string;
  items: ChecklistItem[];
  notes: ChecklistNote[];
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
  progress: number;
  averageRating: string;
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
      <div className="bg-white rounded-lg shadow p-6">
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
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
        setFilteredClasses(trafficSchoolClasses);
      } catch (err) {
        console.error("Error fetching traffic school classes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [customerId]);

  useEffect(() => {
    let filtered = classes;

    if (dateFilter) {
      filtered = filtered.filter((cls) => {
        // Extract date without timezone issues
        const date = new Date(cls.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const classDate = `${year}-${month}-${day}`;
        return classDate === dateFilter;
      });
    }

    if (statusFilter) {
      filtered = filtered.filter((cls) => {
        if (statusFilter === "assigned") {
          return cls.status === "student" || cls.status === "available";
        }
        if (statusFilter === "cancelled") {
          return cls.status === "studentcancel";
        }
        if (statusFilter === "pending") {
          return cls.status === "requeststude";
        }
        return cls.status === statusFilter;
      });
    }

    setFilteredClasses(filtered);
  }, [dateFilter, statusFilter, classes]);

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
      
      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        {(dateFilter || statusFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFilter("");
                setStatusFilter("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No classes found for this customer.
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No classes match the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClasses.map((cls) => (
                <tr key={cls._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cls.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cls.locationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cls.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cls.hour} - {cls.endHour}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cls.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={cn(
                        "px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent",
                        cls.status === "student"
                          ? "border-blue-500 text-blue-600"
                          : cls.status === "studentcancel"
                          ? "border-red-500 text-red-600"
                          : cls.status === "requeststude"
                          ? "border-yellow-500 text-yellow-600"
                          : cls.status === "available"
                          ? "border-green-500 text-green-600"
                          : cls.status === "cancel"
                          ? "border-red-500 text-red-600"
                          : cls.status === "full"
                          ? "border-yellow-500 text-yellow-600"
                          : "border-gray-400 text-gray-600"
                      )}
                    >
                      {cls.status === "student" || cls.status === "available"
                        ? "Assigned" 
                        : cls.status === "studentcancel" 
                        ? "Cancelled" 
                        : cls.status === "requeststude" 
                        ? "Pending" 
                        : cls.status}
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
  const [filteredTests, setFilteredTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}/driving-tests`);
        if (!res.ok) throw new Error("Failed to fetch driving tests");
        const data = await res.json();
        setTests(data);
        setFilteredTests(data);
      } catch (err) {
        console.error("Error fetching driving tests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [customerId]);

  useEffect(() => {
    let filtered = tests;

    if (dateFilter) {
      filtered = filtered.filter((test) => {
        // Extract date without timezone issues
        const date = new Date(test.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const testDate = `${year}-${month}-${day}`;
        return testDate === dateFilter;
      });
    }

    if (statusFilter) {
      filtered = filtered.filter((test) => {
        return test.status === statusFilter;
      });
    }

    setFilteredTests(filtered);
  }, [dateFilter, statusFilter, tests]);

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
      
      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="booked">Booked</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {(dateFilter || statusFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFilter("");
                setStatusFilter("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {tests.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No driving tests found for this customer.
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No driving tests match the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTests.map((test) => (
                <tr key={test._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {test.instructorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(test.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {test.startTime} - {test.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${test.amount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={cn(
                        "px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent",
                        test.paid
                          ? "border-green-500 text-green-600"
                          : "border-yellow-500 text-yellow-600"
                      )}
                    >
                      {test.paid ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={cn(
                        "px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent",
                        test.status === "student"
                          ? "border-blue-500 text-blue-600"
                          : test.status === "studentcancel"
                          ? "border-red-500 text-red-600"
                          : test.status === "requeststude"
                          ? "border-yellow-500 text-yellow-600"
                          : test.status === "available"
                          ? "border-green-500 text-green-600"
                          : test.status === "cancelled"
                          ? "border-red-500 text-red-600"
                          : test.status === "booked"
                          ? "border-blue-500 text-blue-600"
                          : "border-gray-400 text-gray-600"
                      )}
                    >
                      {test.status === "student" || test.status === "available"
                        ? "Assigned" 
                        : test.status === "studentcancel" 
                        ? "Cancelled" 
                        : test.status === "requeststude" 
                        ? "Pending" 
                        : test.status}
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

// Driving Lesson History Component with Session Checklists
const DrivingLessonHistory = ({ customerId }: { customerId: string }) => {
  const [checklists, setChecklists] = useState<SessionChecklistData[]>([]);
  const [filteredChecklists, setFilteredChecklists] = useState<SessionChecklistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}/session-checklists`);
        if (!res.ok) throw new Error("Failed to fetch session checklists");
        const data = await res.json();
        setChecklists(data);
        setFilteredChecklists(data);
      } catch (err) {
        console.error("Error fetching session checklists:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklists();
  }, [customerId]);

  useEffect(() => {
    let filtered = checklists;

    if (dateFilter) {
      filtered = filtered.filter((checklist) => {
        // Extract date without timezone issues
        const date = new Date(checklist.createdAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const checklistDate = `${year}-${month}-${day}`;
        return checklistDate === dateFilter;
      });
    }

    if (statusFilter) {
      filtered = filtered.filter((checklist) => {
        return checklist.status === statusFilter;
      });
    }

    setFilteredChecklists(filtered);
  }, [dateFilter, statusFilter, checklists]);

  const toggleChecklistDetails = (checklistId: string) => {
    setExpandedChecklist(expandedChecklist === checklistId ? null : checklistId);
  };

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

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Date
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {(dateFilter || statusFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFilter("");
                setStatusFilter("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {checklists.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No driving lessons found for this customer.
        </div>
      ) : filteredChecklists.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No driving lessons match the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Checklist Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Rating
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredChecklists.map((checklist) => (
                <React.Fragment key={checklist._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(checklist.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {checklist.instructorName}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {checklist.checklistType}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${checklist.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{checklist.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold">{checklist.averageRating}</span>/10
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span
                        className={cn(
                          "px-3 py-1 inline-flex text-xs font-semibold rounded-md border-2 bg-transparent",
                          checklist.status === "completed"
                            ? "border-green-500 text-green-600"
                            : checklist.status === "in_progress"
                            ? "border-blue-500 text-blue-600"
                            : "border-yellow-500 text-yellow-600"
                        )}
                      >
                        {checklist.status === "in_progress"
                          ? "In Progress"
                          : checklist.status
                          ? checklist.status.charAt(0).toUpperCase() + checklist.status.slice(1)
                          : "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleChecklistDetails(checklist._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs"
                      >
                        {expandedChecklist === checklist._id ? "Hide Details" : "View Details"}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedChecklist === checklist._id && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 bg-gray-50">
                        <div className="space-y-4">
                          {/* Checklist Items */}
                          <div>
                            <h4 className="font-semibold text-sm mb-3 text-gray-700">Assessment Items:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {checklist.items.map((item, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-white border border-gray-200 rounded-lg"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-sm text-gray-900">
                                        {item.name}
                                      </h5>
                                      {item.rating !== undefined && item.rating !== null && (
                                        <div className="mt-1 flex items-center gap-2">
                                          <div className="flex items-center">
                                            {[...Array(10)].map((_, i) => (
                                              <span
                                                key={i}
                                                className={cn(
                                                  "text-xs",
                                                  i < (item.rating ?? 0)
                                                    ? "text-yellow-500"
                                                    : "text-gray-300"
                                                )}
                                              >
                                                ★
                                              </span>
                                            ))}
                                          </div>
                                          <span className="text-xs font-semibold text-gray-700">
                                            {item.rating}/10
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {item.completed && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                        ✓ Done
                                      </span>
                                    )}
                                  </div>
                                  {item.comments && (
                                    <p className="text-xs text-gray-600 mt-2 italic">
                                      &quot;{item.comments}&quot;
                                    </p>
                                  )}
                                  {item.tally !== undefined && item.tally > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Tally: {item.tally}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Notes */}
                          {checklist.notes && checklist.notes.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-gray-700">Instructor Notes:</h4>
                              <div className="space-y-2">
                                {checklist.notes.map((note, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-white border-l-4 border-blue-500 rounded"
                                  >
                                    <p className="text-sm text-gray-800">{note.text}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(note.date).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClassHistory;
