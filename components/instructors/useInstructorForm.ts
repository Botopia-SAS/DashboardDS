"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { instructorFormSchema } from "./instructorFormSchema";
import { InstructorData } from "./types";

export const useInstructorForm = (initialData?: InstructorData) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  const form = useForm<InstructorData>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      dni: initialData?.dni || "",
      email: initialData?.email || "",
      password: "", // Siempre vacío para edición, no mostrar contraseña encriptada
      photo: initialData?.photo || "",
      experience: initialData?.experience || "",
      certifications: initialData?.certifications || "",
      canTeachTicketClass: initialData?.canTeachTicketClass || false,
      canTeachDrivingTest: initialData?.canTeachDrivingTest || false,
      canTeachDrivingLesson: initialData?.canTeachDrivingLesson || false,
    },
  });

  const hasChanges = form.formState.isDirty;

  // Generate random password
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    form.setValue("password", password);
    toast.success("Password generated successfully!");
  };

  // Submit form
  const onSubmit = async (values: InstructorData) => {
    try {
      setLoading(true);
      setSavingChanges(true);

      const url = initialData 
        ? `/api/instructors/${initialData._id}` 
        : "/api/instructors";
      
      const method = initialData ? "PATCH" : "POST";

      // Para actualización, incluir el instructorId en el body
      // Solo enviar password si no está vacío (para evitar sobrescribir con string vacío)
      const bodyData = { ...values };
      if (initialData && (!bodyData.password || bodyData.password.trim() === "")) {
        delete bodyData.password;
      }

      const body = initialData 
        ? { instructorId: initialData._id, ...bodyData }
        : bodyData;

      // console.log("📤 Enviando datos:", { method, url, body });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Error response:", errorData);
        throw new Error(errorData.message || "Failed to save instructor");
      }

      const data = await response.json();
      // console.log("✅ Respuesta exitosa:", data);
      
      toast.success(
        initialData 
          ? "Instructor updated successfully!" 
          : "Instructor created successfully!"
      );
      
      router.push("/instructors");
      router.refresh();
      
    } catch (error) {
      console.error("Error saving instructor:", error);
      toast.error("Failed to save instructor. Please try again.");
    } finally {
      setLoading(false);
      setSavingChanges(false);
    }
  };

  return {
    form,
    loading,
    savingChanges,
    hasChanges,
    generatePassword,
    onSubmit,
    router,
  };
};

