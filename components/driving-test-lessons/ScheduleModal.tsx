"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
  selectedTime?: string;
  onScheduleCreated?: () => void;
  selectedInstructor?: any;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  onScheduleCreated,
  selectedInstructor
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [durationType, setDurationType] = useState("2"); // 1, 2, 3, or "custom"
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    classType: "driving lesson",
    start: selectedTime || "",
    end: "",
    status: "available",
    amount: "",
    recurrence: "none",
    studentId: "",
    paid: false
  });

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const defaultEndTime = selectedTime ? getDefaultEndTime(selectedTime, 2) : "";
      setFormData({
        classType: "driving lesson",
        start: selectedTime || "",
        end: defaultEndTime,
        status: "available",
        amount: "",
        recurrence: "none",
        studentId: "",
        paid: false
      });
      setDurationType("2");
      setErrors([]);
      setSearchTerm("");
    }
  }, [isOpen, selectedTime]);

  const getDefaultEndTime = (startTime: string, hours: number) => {
    if (!startTime) return "";
    const [hoursStart, minutes] = startTime.split(":").map(Number);
    let endHours = hoursStart + hours;
    if (endHours >= 24) endHours = 23;
    return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const handleDurationChange = (value: string) => {
    setDurationType(value);
    if (value !== "custom" && formData.start) {
      const hours = parseInt(value);
      const newEndTime = getDefaultEndTime(formData.start, hours);
      setFormData(prev => ({
        ...prev,
        end: newEndTime
      }));
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === "start") {
      if (durationType !== "custom") {
        const hours = parseInt(durationType);
        const newEndTime = getDefaultEndTime(value as string, hours);
        setFormData(prev => ({
          ...prev,
          end: newEndTime
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.classType) newErrors.push("Class type is required");
    if (!selectedInstructor?._id) newErrors.push("Instructor is required");
    if (!formData.start) newErrors.push("Start time is required");
    if (!formData.end) newErrors.push("End time is required");
    if (!formData.status) newErrors.push("Status is required");
    if (formData.start >= formData.end) newErrors.push("End time must be after start time");
    
    // Validate student ID for driving test with booked/pending status
    if (formData.classType === "driving test" && 
        (formData.status === "booked" || formData.status === "pending") && 
        !formData.studentId) {
      newErrors.push("Student is required for booked/pending driving tests");
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const endpoint = formData.classType === "driving test" 
        ? "/api/driving-test-lessons/driving-test"
        : "/api/driving-test-lessons/driving-lesson";

      const requestBody = {
        instructorId: selectedInstructor._id,
        date: selectedDate,
        start: formData.start,
        end: formData.end,
        status: formData.status,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        recurrence: formData.recurrence,
        ...(formData.classType === "driving test" && { 
          classType: "driving test",
          ...(formData.studentId && { studentId: formData.studentId }),
          ...(formData.status === "booked" || formData.status === "pending" ? { paid: formData.paid } : {})
        })
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert("Schedule created successfully!");
        onScheduleCreated?.();
        onClose();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("Error creating schedule");
    } finally {
      setLoading(false);
    }
  };

  // Check if we should show additional fields for driving test
  const showDrivingTestFields = formData.classType === "driving test" && 
    (formData.status === "booked" || formData.status === "pending");

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected user name for display
  const selectedUser = users.find(user => user._id === formData.studentId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg border p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Configure Schedule</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        {selectedDate && selectedTime && (
          <div className="text-sm text-gray-600 mb-4">
            Date: {selectedDate} Time: {selectedTime}
          </div>
        )}
        
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {selectedInstructor && (
          <div className="mb-4 p-2 bg-gray-50 rounded">
            <div className="text-sm">
              {selectedInstructor.name} {selectedInstructor.email}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Class type *</Label>
            <Select 
              value={formData.classType} 
              onValueChange={(value) => handleInputChange("classType", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select class type" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="driving test" className="hover:bg-gray-100">Driving Test</SelectItem>
                <SelectItem value="driving lesson" className="hover:bg-gray-100">Driving Lesson</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Duration</Label>
            <div className="flex space-x-2 mt-1">
              {[
                { value: "1", label: "1 Hour" },
                { value: "2", label: "2 Hours" },
                { value: "3", label: "3 Hours" },
                { value: "4", label: "4 Hours" },
                { value: "5", label: "5 Hours" },
                { value: "custom", label: "Custom" }
              ].map((duration) => (
                <button
                  key={duration.value}
                  type="button"
                  onClick={() => handleDurationChange(duration.value)}
                  className={`px-3 py-1 text-sm border rounded ${
                    durationType === duration.value
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={formData.start}
                onChange={(e) => handleInputChange("start", e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label>End Time *</Label>
              <Input
                type="time"
                value={formData.end}
                onChange={(e) => handleInputChange("end", e.target.value)}
                required
                className="w-full"
                disabled={durationType !== "custom"}
              />
            </div>
          </div>

          <div>
            <Label>Recurrence</Label>
            <Select 
              value={formData.recurrence} 
              onValueChange={(value) => handleInputChange("recurrence", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                <SelectItem value="none" className="hover:bg-gray-100">None</SelectItem>
                <SelectItem value="daily" className="hover:bg-gray-100">Daily</SelectItem>
                <SelectItem value="weekly" className="hover:bg-gray-100">Weekly</SelectItem>
                <SelectItem value="monthly" className="hover:bg-gray-100">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <div className="flex space-x-4 mt-2">
              {[
                { value: "available", label: "Available" },
                { value: "booked", label: "Booked" },
                { value: "cancelled", label: "Cancelled" },
                { value: "expired", label: "Expired" },
                { value: "pending", label: "Pending" }
              ].map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={status.value}
                    name="status"
                    value={status.value}
                    checked={formData.status === status.value}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={status.value} className="text-sm cursor-pointer">
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Amount ($)</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full"
            />
          </div>

          {showDrivingTestFields && (
            <>
              <div>
                <Label>Students</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search student..."
                    className="w-full mb-2"
                  />
                  <div className="max-h-20 overflow-y-auto border border-gray-200 rounded bg-white">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          id={`user-${user._id}`}
                          checked={formData.studentId === user._id}
                          onChange={() => {
                            handleInputChange("studentId", user._id);
                            setSearchTerm(`${user.firstName} ${user.lastName} (${user.email})`);
                          }}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`user-${user._id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </label>
                        {formData.studentId === user._id && (
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange("studentId", "");
                              setSearchTerm("");
                            }}
                            className="text-red-500 hover:text-red-700 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 border border-red-300"
                            title="Remove student"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {filteredUsers.length === 0 && !selectedUser && (
                      <div className="p-2 text-gray-500">No students found</div>
                    )}
                  </div>
                  {selectedUser && (
                    <div className="mt-2 flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-sm">
                        <span className="font-medium">Selected:</span> {selectedUser.firstName} {selectedUser.lastName}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("studentId", "");
                          setSearchTerm("");
                        }}
                        className="text-red-500 hover:text-red-700 text-lg font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 border border-red-300"
                        title="Remove student"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Payment Status</Label>
                <div className="flex space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="paid-true"
                      name="paid"
                      checked={formData.paid === true}
                      onChange={() => handleInputChange("paid", true)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="paid-true" className="text-sm cursor-pointer">
                      Paid
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="paid-false"
                      name="paid"
                      checked={formData.paid === false}
                      onChange={() => handleInputChange("paid", false)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="paid-false" className="text-sm cursor-pointer">
                      Not Paid
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal; 