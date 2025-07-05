"use client";

import { useState } from "react";
import { Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";

interface DeleteProps {
  item: string;
  id: string;
}

const Delete: React.FC<DeleteProps> = ({ item, id }) => {
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    try {
      setLoading(true);

      // 🔹 Mapeo de entidades permitidas
      const validEntities = ["products", "collections", "classes", "online-courses", "packages", "locations", "fqa", "instructors", "customers"];

      // 🔹 Verificar si `item` es válido, si no, error
      if (!validEntities.includes(item)) {
        toast.error("Invalid item type");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/${item}/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLoading(false);
        
        // Manejo especial para instructores con información de cascade delete
        if (item === "instructors") {
          try {
            const deleteData = await res.json();
            if (deleteData.deletedTicketClasses > 0) {
              toast.success(
                `✅ Instructor "${deleteData.instructorName}" deleted successfully!\n🗑️ Also deleted ${deleteData.deletedTicketClasses} associated ticket classes.`,
                { duration: 5000 }
              );
            } else {
              toast.success(`✅ Instructor "${deleteData.instructorName}" deleted successfully!`);
            }
          } catch {
            // Si no puede parsear JSON, usar mensaje genérico
            toast.success(`${item} deleted`);
          }
        } else {
          toast.success(`${item} deleted`);
        }
        
        window.location.reload();
      } else {
        throw new Error("Failed to delete item");
      }
    } catch (err) {
      console.error("[DELETE_ERROR]", err);
      toast.error("Something went wrong! Please try again.");
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Trash className="h-4 w-4 cursor-pointer text-red-500 hover:text-red-700 transition" />
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white text-grey-1">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this {item}.
            {item === "instructors" && (
              <span className="block mt-2 font-medium text-orange-600">
                ⚠️ Warning: This will also delete all ticket classes associated with this instructor.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 text-white" onClick={onDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Delete;
