"use client";

import { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import useClassTypeStore from "@/app/store/classTypeStore";

interface ClassTypeManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClassTypeManager: React.FC<ClassTypeManagerProps> = ({ isOpen, onClose }) => {
  const { availableClassTypes, setAvailableClassTypes, addClassType } = useClassTypeStore();
  const [newTypeName, setNewTypeName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchClassTypes = async () => {
    try {
      const res = await fetch("/api/classtypes");
      if (res.ok) {
        const data = await res.json();
        setAvailableClassTypes(data);
      }
    } catch (error) {
      console.error("Error fetching class types:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClassTypes();
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!newTypeName.trim()) {
      toast.error("Class type name is required");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/classtypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTypeName.trim() }),
      });

      if (res.ok) {
        const createdType = await res.json();
        addClassType(createdType);
        setNewTypeName("");
        toast.success("Class type added successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add class type");
      }
    } catch (error) {
      console.error("Error adding class type:", error);
      toast.error("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) {
      toast.error("Class type name is required");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/classtypes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (res.ok) {
        await fetchClassTypes();
        setEditingId(null);
        setEditingName("");
        toast.success("Class type updated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update class type");
      }
    } catch (error) {
      console.error("Error updating class type:", error);
      toast.error("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class type?")) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/classtypes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchClassTypes();
        toast.success("Class type deleted successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete class type");
      }
    } catch (error) {
      console.error("Error deleting class type:", error);
      toast.error("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Manage Class Types</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {/* Add New Type */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Class Type</h3>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. CDA, BDE, etc."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdd()}
                disabled={isLoading}
              />
              <Button
                onClick={handleAdd}
                disabled={isLoading || !newTypeName.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* List of Class Types */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Existing Class Types</h3>
            {availableClassTypes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No class types available</p>
            ) : (
              availableClassTypes.map((classType) => (
                <div
                  key={classType._id}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  {editingId === classType._id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleEdit(classType._id)}
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleEdit(classType._id)}
                        disabled={isLoading || !editingName.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-gray-800">
                        {classType.name.toUpperCase()}
                      </span>
                      <Button
                        onClick={() => {
                          setEditingId(classType._id);
                          setEditingName(classType.name);
                        }}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(classType._id)}
                        disabled={isLoading}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClassTypeManager;