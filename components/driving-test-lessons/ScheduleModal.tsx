"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";

// Configurar la API de Google Maps
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const LIBRARIES: "places"[] = ["places"];

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
  selectedTime?: string;
  onScheduleCreated?: () => void;
  selectedInstructor?: {
    _id: string;
    name: string;
    email: string;
    canTeachDrivingTest?: boolean;
    canTeachDrivingLesson?: boolean;
  };
  // Props para edición
  isEditMode?: boolean;
  eventData?: {
    _id?: string;
    title?: string;
    start: string;
    end: string;
    classType?: string;
    extendedProps?: {
      classType?: string;
      status?: string;
      amount?: number;
      studentId?: string;
      studentName?: string;
      paid?: boolean;
      pickupLocation?: string;
      dropoffLocation?: string;
      selectedProduct?: string;
    };
  };
  onEventUpdate?: (data: {
    _id?: string;
    title?: string;
    start: string;
    end: string;
    classType?: string;
    extendedProps?: {
      classType?: string;
      status?: string;
      amount?: number;
      studentId?: string;
      studentName?: string;
      paid?: boolean;
      pickupLocation?: string;
      dropoffLocation?: string;
      selectedProduct?: string;
    };
  }) => void;
  onEventDelete?: (id: string) => void;
  onEventCopy?: (data: {
    _id?: string;
    title?: string;
    start: string;
    end: string;
    classType?: string;
    extendedProps?: {
      classType?: string;
      status?: string;
      amount?: number;
      studentId?: string;
      studentName?: string;
      paid?: boolean;
      pickupLocation?: string;
      dropoffLocation?: string;
      selectedProduct?: string;
    };
  }) => void;
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
  selectedInstructor,
  // Props para edición
  isEditMode,
  eventData,
  onEventUpdate,
  onEventDelete,
  // onEventCopy
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [durationType, setDurationType] = useState("0.5"); // 0.5, 1, 2, 3, or "custom"
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConflictModal, setShowConflictModal] = useState(false);
  
  // Google Maps Autocomplete refs
  const pickupAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });
  const [conflictDetails, setConflictDetails] = useState<{
    type: string;
    status: string;
    date: string;
    time: string;
    message?: string;
  } | null>(null);

  
  const [formData, setFormData] = useState({
    classType: "driving lesson",
    start: selectedTime || "",
    end: "",
    status: "available",
    amount: "",
    pickupLocation: "",
    dropoffLocation: "",
    selectedProduct: "",
    recurrence: "none",
    recurrenceEndDate: "",
    studentId: "",
    paid: false
  });

  // Fetch users and products when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Google Maps Autocomplete handlers
  const onPickupLoad = (autocomplete: google.maps.places.Autocomplete) => {
    pickupAutocompleteRef.current = autocomplete;
  };

  const onPickupPlaceChanged = () => {
    if (pickupAutocompleteRef.current) {
      const place = pickupAutocompleteRef.current.getPlace();
      if (place?.formatted_address) {
        handleInputChange("pickupLocation", place.formatted_address);
      }
    }
  };

  const onDropoffLoad = (autocomplete: google.maps.places.Autocomplete) => {
    dropoffAutocompleteRef.current = autocomplete;
  };

  const onDropoffPlaceChanged = () => {
    if (dropoffAutocompleteRef.current) {
      const place = dropoffAutocompleteRef.current.getPlace();
      if (place?.formatted_address) {
        handleInputChange("dropoffLocation", place.formatted_address);
      }
    }
  };

  // Reset form data when modal opens with new date/time
  useEffect(() => {
    if (isOpen && selectedTime) {
      setFormData(prev => ({
        ...prev,
        start: selectedTime,
        end: getDefaultEndTime(selectedTime, 0.5)
      }));
    }
  }, [isOpen, selectedTime]);

  // Manejar datos pegados del clipboard
  useEffect(() => {
    if (isOpen && !isEditMode) {
      const clipboard = window.localStorage.getItem('driving_schedule_clipboard');
      if (clipboard) {
        try {
          const pastedData = JSON.parse(clipboard);

          setFormData({
            classType: pastedData.classType || "driving lesson",
            start: pastedData.start || selectedTime || "",
            end: pastedData.end || getDefaultEndTime(selectedTime || "", 0.5),
            status: pastedData.status || "available",
            amount: pastedData.amount ? pastedData.amount.toString() : "",
            pickupLocation: pastedData.pickupLocation || "",
            dropoffLocation: pastedData.dropoffLocation || "",
            selectedProduct: pastedData.selectedProduct || "",
            recurrence: pastedData.recurrence || "none",
            recurrenceEndDate: pastedData.recurrenceEndDate || "",
            studentId: pastedData.studentId || "",
            paid: pastedData.paid || false
          });
          
          // Calcular duración basada en las horas
          if (pastedData.start && pastedData.end) {
            const startTime = new Date(`2000-01-01T${pastedData.start}:00`);
            const endTime = new Date(`2000-01-01T${pastedData.end}:00`);
            const durationHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
            setDurationType(durationHours.toString());
          } else {
            setDurationType("2");
          }
          
          // Actualizar searchTerm si hay un estudiante
          if (pastedData.studentName) {
            setSearchTerm(pastedData.studentName);
          } else {
            setSearchTerm("");
          }
          
          // Limpiar el clipboard después de usarlo
          window.localStorage.removeItem('driving_schedule_clipboard');
          
        } catch (error) {
          console.error("Error loading pasted data:", error);
        }
      }
    }
  }, [isOpen, selectedTime, isEditMode]);

  // TERCERO: Manejar datos de edición y carga normal
  useEffect(() => {
    if (isOpen) {
      // Si estamos en modo edición, cargar datos del evento
      if (isEditMode && eventData) {
        // console.log("🔄 Loading event data for editing:", eventData);
        
        // Determinar el tipo de clase basado en las propiedades del evento
        let classType = eventData.extendedProps?.classType || "";
        
        // Si no hay classType en extendedProps, intentar determinarlo por el color o título
        if (!classType) {
          if (eventData.title?.includes("Driving Test")) {
            classType = "driving test";
          } else if (eventData.title?.includes("Driving Lesson")) {
            classType = "driving lesson";
          }
        }
        
        // También verificar si hay classType directamente en eventData
        if (!classType && eventData.classType) {
          classType = eventData.classType;
        }
        
        // Parsear las fechas correctamente
        const startDate = new Date(eventData.start);
        const endDate = new Date(eventData.end);
        
        // Formatear las horas en formato HH:mm para los inputs
        const formatTimeForInput = (date: Date) => {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        };
        
        const startTime = formatTimeForInput(startDate);
        const endTime = formatTimeForInput(endDate);
        
        const newFormData = {
          classType: classType || "driving lesson", // Cambiar default a driving lesson
          start: startTime,
          end: endTime,
          status: eventData.extendedProps?.status || "available",
          amount: eventData.extendedProps?.amount ? eventData.extendedProps.amount.toString() : "",
          pickupLocation: eventData.extendedProps?.pickupLocation || "",
          dropoffLocation: eventData.extendedProps?.dropoffLocation || "",
          selectedProduct: eventData.extendedProps?.selectedProduct || "",
          studentId: eventData.extendedProps?.studentId || "",
          paid: eventData.extendedProps?.paid || false,
          recurrence: "none",
          recurrenceEndDate: ""
        };
        
        // console.log("📝 Setting form data with product:", {
        //   selectedProduct: eventData.extendedProps?.selectedProduct,
        //   newFormDataSelectedProduct: newFormData.selectedProduct
        // });
        
        // console.log("📝 Setting form data:", newFormData);
        setFormData(newFormData);
        
        // Actualizar searchTerm si hay un estudiante
        if (eventData.extendedProps?.studentName) {
          setSearchTerm(eventData.extendedProps.studentName);
        } else if (eventData.extendedProps?.studentId) {
          // Si no hay studentName pero sí studentId, buscar el estudiante en la lista
          const student = users.find(user => user._id === eventData.extendedProps?.studentId);
          if (student) {
            setSearchTerm(`${student.firstName} ${student.lastName} (${student.email})`);
          }
        }
        
        // Calcular duración para el botón de duración
        const durationHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
        setDurationType(durationHours.toString());
      } else {
        // Determinar el class type por defecto según los permisos del instructor
        let defaultClassType = "driving lesson";
        if (selectedInstructor) {
          if (selectedInstructor.canTeachDrivingTest && !selectedInstructor.canTeachDrivingLesson) {
            defaultClassType = "driving test";
          } else if (selectedInstructor.canTeachDrivingLesson && !selectedInstructor.canTeachDrivingTest) {
            defaultClassType = "driving lesson";
          } else if (selectedInstructor.canTeachDrivingTest && selectedInstructor.canTeachDrivingLesson) {
            // Si puede ambos, mantener driving lesson como default
            defaultClassType = "driving lesson";
          }
        }
        
        setFormData({
          classType: defaultClassType,
          start: selectedTime || "",
          end: getDefaultEndTime(selectedTime || "", 2),
          status: "available",
          amount: "",
          pickupLocation: "",
          dropoffLocation: "",
          selectedProduct: "",
          recurrence: "none",
          recurrenceEndDate: "",
          studentId: "",
          paid: false
        });
        setDurationType("2");
        setSearchTerm("");
      }
      setErrors([]);
    }
  }, [isOpen, selectedTime, selectedInstructor, isEditMode, eventData, users, products]);

  // Forzar que el classType se mantenga si está vacío pero tenemos eventData
  useEffect(() => {
    if (isEditMode && !formData.classType && eventData) {
      let forcedClassType = eventData.extendedProps?.classType || "";
      if (!forcedClassType && eventData.title?.includes("Driving Test")) {
        forcedClassType = "driving test";
      } else if (!forcedClassType && eventData.title?.includes("Driving Lesson")) {
        forcedClassType = "driving lesson";
      }
      
      if (forcedClassType) {
        setFormData(prev => ({
          ...prev,
          classType: forcedClassType
        }));
      }
    }
  }, [formData.classType, isEditMode, eventData]);

  // Asegurar que los datos del estudiante se carguen cuando los usuarios estén disponibles
  useEffect(() => {
    if (isEditMode && eventData && users.length > 0 && formData.studentId && !searchTerm) {
      const student = users.find(user => user._id === formData.studentId);
      if (student) {
        setSearchTerm(`${student.firstName} ${student.lastName} (${student.email})`);
      }
    }
  }, [isEditMode, eventData, users, formData.studentId, searchTerm]);

  // Asegurar que el producto se cargue cuando los productos estén disponibles
  useEffect(() => {
    if (isEditMode && eventData && products.length > 0 && eventData.extendedProps?.selectedProduct) {
      // console.log("🔄 Loading product data:", {
      //   selectedProductId: eventData.extendedProps.selectedProduct,
      //   currentFormProduct: formData.selectedProduct,
      //   availableProducts: products.map(p => ({ id: p._id, name: p.title }))
      // });
      
      const product = products.find(p => p._id === eventData.extendedProps?.selectedProduct);
      if (product) {
        // console.log("✅ Found product:", product.title);
        setFormData(prev => ({
          ...prev,
          selectedProduct: product._id
        }));
      } else {
        // console.log("❌ Product not found in available products");
      }
    }
  }, [isEditMode, eventData, products]);

  const getDefaultEndTime = (startTime: string, duration: number) => {
    if (!startTime) return "";
    const [hoursStart, minutesStart] = startTime.split(":").map(Number);
    const totalMinutes = hoursStart * 60 + minutesStart + (duration * 60);
    let endHours = Math.floor(totalMinutes / 60);
    let endMinutes = totalMinutes % 60;
    if (endHours >= 24) {
      endHours = 23;
      endMinutes = 59;
    }
    return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
  };

  const handleDurationChange = (value: string) => {
    setDurationType(value);
    if (value !== "custom" && formData.start) {
      const duration = parseFloat(value);
      const newEndTime = getDefaultEndTime(formData.start, duration);
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
        const duration = parseFloat(durationType);
        const newEndTime = getDefaultEndTime(value as string, duration);
        setFormData(prev => ({
          ...prev,
          end: newEndTime
        }));
      }
    }

    // Automatically set paid to true when status changes to booked or pending
    if (field === "status" && (value === "booked" || value === "pending")) {
      setFormData(prev => ({
        ...prev,
        paid: true
      }));
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
    
    // Validate recurrence
    if (formData.recurrence && formData.recurrence !== "none" && !formData.recurrenceEndDate) {
      newErrors.push("Recurrence end date is required when recurrence is enabled");
    }
    
    // Validate amount for driving test
    if (formData.classType === "driving test" && 
        (!formData.amount || formData.amount === "0" || formData.amount === "0.00")) {
      newErrors.push("Amount is required and must be greater than 0 for driving tests");
    }
    
    // Validate location fields for driving lesson with booked/pending status
    if (formData.classType === "driving lesson" && 
        (formData.status === "booked" || formData.status === "pending")) {
      if (!formData.pickupLocation) newErrors.push("Pickup location is required for driving lessons");
      if (!formData.dropoffLocation) newErrors.push("Dropoff location is required for driving lessons");
    }
    
    // Validate student ID for driving test with booked/pending status
    if (formData.classType === "driving test" && 
        (formData.status === "booked" || formData.status === "pending") && 
        !formData.studentId) {
      newErrors.push("Student is required for booked/pending driving tests");
    }
    
    // Validate student ID for driving lesson with booked/pending status
    if (formData.classType === "driving lesson" && 
        (formData.status === "booked" || formData.status === "pending") && 
        !formData.studentId) {
      newErrors.push("Student is required for booked/pending driving lessons");
    }
    
    // Validate product selection for students with booked/pending status (only for driving lesson)
    // Skip this validation since product selection is currently disabled in the UI for driving lessons
    // The product field is intentionally hidden with {false &&} condition
    // If you need to re-enable product validation, remove this comment and enable the condition below
    /*
    if (formData.classType === "driving lesson" &&
        formData.studentId && 
        (formData.status === "booked" || formData.status === "pending") && 
        !formData.selectedProduct &&
        !isEditMode) {
      newErrors.push("Product selection is required when a student is assigned");
    }
    */
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Función para validar conflictos de horarios
  const validateScheduleConflict = async () => {
    if (!selectedInstructor?._id || !selectedDate || !formData.start || !formData.end) {
      return false;
    }

    try {
      const response = await fetch(`/api/driving-test-lessons/events?instructorId=${selectedInstructor._id}`);
      if (!response.ok) return false;

      const events = await response.json();
      
      // Verificar conflictos con eventos existentes
      for (const event of events) {
        const eventDate = event.start.split('T')[0];
        
        // Solo verificar eventos del mismo día
        if (eventDate === selectedDate) {
          const eventStart = event.start.split('T')[1].slice(0, 5); // HH:mm
          const eventEnd = event.end.split('T')[1].slice(0, 5); // HH:mm
          
          // Verificar si hay superposición
          if (
            (formData.start < eventEnd && formData.end > eventStart) ||
            (eventStart < formData.end && eventEnd > formData.start)
          ) {
            return {
              hasConflict: true,
              conflictingEvent: event
            };
          }
        }
      }
      
      return { hasConflict: false };
    } catch (error) {
      console.error("Error validating schedule conflict:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInstructor?._id) {
      alert("No instructor selected");
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    // Validación adicional según el tipo de clase
    if (formData.classType === "driving test" && (!formData.amount || parseFloat(formData.amount) <= 0)) {
      setErrors(["Amount is required and must be greater than 0 for driving tests"]);
      return;
    }

    // Validar conflictos de horarios
    const conflictValidation = await validateScheduleConflict();
    if (conflictValidation && conflictValidation.hasConflict) {
      const conflictingEvent = conflictValidation.conflictingEvent;
      const conflictTime = `${conflictingEvent.start.split('T')[1].slice(0, 5)} - ${conflictingEvent.end.split('T')[1].slice(0, 5)}`;
      const conflictType = conflictingEvent.classType === 'driving test' ? 'Test' : 'Lesson';
      const conflictStatus = conflictingEvent.status;
      
              setConflictDetails({
          type: conflictType,
          status: conflictStatus,
          time: conflictTime,
          date: selectedDate || ""
        });
      setShowConflictModal(true);
      return;
    }

    setLoading(true);
    
    try {
      const endpoint = formData.classType === "driving test" 
        ? "/api/driving-test-lessons/driving-test"
        : "/api/driving-test-lessons/driving-lesson";

      // Obtener el nombre del estudiante si está seleccionado
      const selectedUser = users.find(user => user._id === formData.studentId);
      const studentName = selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : null;

      const requestBody = {
        instructorId: selectedInstructor?._id || "",
        date: selectedDate || "",
        start: formData.start,
        end: formData.end,
        status: formData.status,
        recurrence: formData.recurrence,
        recurrenceEndDate: formData.recurrenceEndDate,
        ...(formData.classType === "driving test" && { 
          classType: "driving test",
          amount: formData.amount ? parseFloat(formData.amount) : null,
          ...(formData.studentId && { 
            studentId: formData.studentId,
            studentName: studentName
          }),
          ...(formData.status === "booked" || formData.status === "pending" ? { paid: formData.paid } : {})
        }),
        ...(formData.classType === "driving lesson" && { 
          classType: "driving lesson",
          pickupLocation: formData.pickupLocation,
          dropoffLocation: formData.dropoffLocation,
          selectedProduct: formData.selectedProduct,
          ...(formData.studentId && { 
            studentId: formData.studentId,
            studentName: studentName
          }),
          ...(formData.status === "booked" || formData.status === "pending" ? { paid: formData.paid } : {})
        })
      };

      // console.log("🔄 Sending request with recurrence data:", {
      //   recurrence: formData.recurrence,
      //   recurrenceEndDate: formData.recurrenceEndDate,
      //   requestBody
      // });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // Schedule created successfully - close modal without alert
        onScheduleCreated?.();
        onClose();
      } else {
        const error = await response.json();
        if (response.status === 409) {
          setConflictDetails({
            type: "Class",
            status: "Scheduled",
            time: `${formData.start} - ${formData.end}`,
            date: selectedDate || "",
            message: error.message
          });
          setShowConflictModal(true);
        } else {
          alert(`Error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("Error creating schedule");
    } finally {
      setLoading(false);
    }
  };

  // Funciones para edición
  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    // Validación adicional según el tipo de clase
    if (formData.classType === "driving test" && (!formData.amount || parseFloat(formData.amount) <= 0)) {
      setErrors(["Amount is required and must be greater than 0 for driving tests"]);
      return;
    }

    setLoading(true);
    try {
      const selectedUser = users.find(user => user._id === formData.studentId);
      const studentName = selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : null;

      // Obtener el classType original del evento
      const originalClassType = eventData?.extendedProps?.classType || eventData?.classType;
      const eventId = eventData?._id;

      const updateData = {
        eventId: eventId,
        instructorId: selectedInstructor?._id || "",
        classType: formData.classType,
        date: selectedDate || "",
        start: formData.start,
        end: formData.end,
        status: formData.status,
        ...(formData.classType === "driving test" && { 
          amount: formData.amount ? parseFloat(formData.amount) : null,
          studentId: formData.studentId || null,
          paid: formData.paid,
        }),
        ...(formData.classType === "driving lesson" && { 
          pickupLocation: formData.pickupLocation,
          dropoffLocation: formData.dropoffLocation,
          selectedProduct: formData.selectedProduct,
          studentId: formData.studentId || null,
          paid: formData.paid,
        }),
        studentName: studentName,
        originalClassType
      };

      if (onEventUpdate) {
        await onEventUpdate(updateData);
      }
      onClose();
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Error updating event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const eventId = eventData?._id;
    
    if (!eventId) {
      return;
    }
    
    setLoading(true);
    try {
      if (onEventDelete) {
        await onEventDelete(eventId);
      }
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setLoading(false);
    }
  };



  // Check if we should show additional fields for driving test
  const showDrivingTestFields = (formData.classType === "driving test" && 
    (formData.status === "booked" || formData.status === "pending" || formData.status === "cancelled")) || 
    (isEditMode && eventData?.extendedProps?.classType === "driving test" && 
     (eventData.extendedProps?.status === "booked" || eventData.extendedProps?.status === "pending" || eventData.extendedProps?.status === "cancelled"));

  // Check if we should show location fields for driving lesson
  const showDrivingLessonLocationFields = (formData.classType === "driving lesson" && 
    (formData.status === "booked" || formData.status === "pending" || formData.status === "cancelled")) || 
    (isEditMode && eventData?.extendedProps?.classType === "driving lesson" && 
     (eventData.extendedProps?.status === "booked" || eventData.extendedProps?.status === "pending" || eventData.extendedProps?.status === "cancelled"));



  // Filter users based on search term - search by name, email, first name, or last name
  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const firstName = user.firstName.toLowerCase();
    const lastName = user.lastName.toLowerCase();

    return fullName.includes(search) ||
           email.includes(search) ||
           firstName.includes(search) ||
           lastName.includes(search);
  });

  // Get selected user name for display
  const selectedUser = users.find(user => user._id === formData.studentId);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-50">
      <div className="schedule-modal-container bg-white rounded-lg shadow-lg border w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header fijo */}
        <div className="flex-shrink-0 p-2 border-b border-gray-200">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-semibold">
              {isEditMode ? "Edit Schedule" : "Configure Schedule"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
          
          {selectedDate && selectedTime && (
            <div className="text-xs text-gray-600">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} at {selectedTime}
            </div>
          )}
        </div>
        
        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {errors.length > 0 && (
            <div className="mb-2 p-1.5 bg-red-50 border border-red-200 rounded">
              <ul className="text-xs text-red-700 space-y-0.5">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {selectedInstructor && (
            <div className="mb-2 p-1.5 bg-gray-50 rounded">
              <div className="text-xs">
                {selectedInstructor.name} - {selectedInstructor.email}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-2">
          <div>
            <Label className="text-sm font-medium">Class type <span className="text-red-500">*</span></Label>
            <Select
              value={formData.classType || (isEditMode && eventData ? (eventData.extendedProps?.classType || (eventData.title?.includes("Driving Test") ? "driving test" : "driving lesson")) : "")}
              onValueChange={(value) => handleInputChange("classType", value)}
              required
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
            <Label className="text-sm font-medium">Duration</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {[
                { value: "0.5", label: "30m" },
                { value: "1", label: "1h" },
                { value: "2", label: "2h" },
                { value: "3", label: "3h" },
                { value: "4", label: "4h" },
                { value: "5", label: "5h" },
                { value: "custom", label: "Custom" }
              ].map((duration) => (
                <button
                  key={duration.value}
                  type="button"
                  onClick={() => handleDurationChange(duration.value)}
                  className={`px-2 py-1 text-xs border rounded ${
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
              <Label className="text-sm font-medium">Start Time *</Label>
              <Input
                type="time"
                value={formData.start}
                onChange={(e) => handleInputChange("start", e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">End Time *</Label>
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
            <Label className="text-sm font-medium">Recurrence</Label>
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

          {formData.recurrence !== "none" && (
            <div>
              <Label>Recurrence End Date</Label>
              <Input
                type="date"
                value={formData.recurrenceEndDate}
                onChange={(e) => handleInputChange("recurrenceEndDate", e.target.value)}
                min={selectedDate}
                className="w-full"
              />
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {[
                { value: "available", label: "Available" },
                { value: "booked", label: "Booked" },
                { value: "cancelled", label: "Cancelled" },
                { value: "expired", label: "Expired" },
                { value: "pending", label: "Pending" }
              ].map((status) => (
                <div key={status.value} className="flex items-center space-x-1 text-sm">
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

          {/* Show Amount for Driving Test, Location fields for Driving Lesson */}
          {formData.classType === "driving test" ? (
            <div>
              <Label className="text-sm font-medium">Amount ($) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full"
                required
              />
            </div>
          ) : formData.classType === "driving lesson" && showDrivingLessonLocationFields ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Pickup Location <span className="text-red-500">*</span></Label>
                {isLoaded ? (
                  <Autocomplete
                    onLoad={onPickupLoad}
                    onPlaceChanged={onPickupPlaceChanged}
                  >
                    <Input
                      type="text"
                      value={formData.pickupLocation}
                      onChange={(e) => handleInputChange("pickupLocation", e.target.value)}
                      placeholder="Enter pickup location"
                      className="w-full"
                      required
                    />
                  </Autocomplete>
                ) : (
                  <Input
                    type="text"
                    value={formData.pickupLocation}
                    onChange={(e) => handleInputChange("pickupLocation", e.target.value)}
                    placeholder="Loading Google Maps..."
                    className="w-full"
                    required
                    disabled
                  />
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Dropoff Location <span className="text-red-500">*</span></Label>
                {isLoaded ? (
                  <Autocomplete
                    onLoad={onDropoffLoad}
                    onPlaceChanged={onDropoffPlaceChanged}
                  >
                    <Input
                      type="text"
                      value={formData.dropoffLocation}
                      onChange={(e) => handleInputChange("dropoffLocation", e.target.value)}
                      placeholder="Enter dropoff location"
                      className="w-full"
                      required
                    />
                  </Autocomplete>
                ) : (
                  <Input
                    type="text"
                    value={formData.dropoffLocation}
                    onChange={(e) => handleInputChange("dropoffLocation", e.target.value)}
                    placeholder="Loading Google Maps..."
                    className="w-full"
                    required
                    disabled
                  />
                )}
              </div>
            </div>
          ) : null}

          {showDrivingTestFields && (
            <>
              <div>
                <Label>Students</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, first/last name..."
                    className="w-full mb-1.5"
                  />
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded bg-white space-y-0.5 p-1">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
                      >
                        <label htmlFor={`user-${user._id}`} className="flex-1 cursor-pointer min-w-0">
                          <div className="font-medium text-sm truncate">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-gray-600 truncate">{user.email}</div>
                        </label>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
                      </div>
                    ))}
                    {filteredUsers.length === 0 && !selectedUser && (
                      <div className="p-2 text-gray-500 text-sm">No students found</div>
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

          {/* Student and Product Selection for Driving Lesson */}
          {formData.classType === "driving lesson" && (formData.status === "booked" || formData.status === "pending" || formData.status === "cancelled") && (
            <>
              <div>
                <Label>Students</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, first/last name..."
                    className="w-full mb-1.5"
                  />
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded bg-white space-y-0.5 p-1">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
                      >
                        <label htmlFor={`user-${user._id}`} className="flex-1 cursor-pointer min-w-0">
                          <div className="font-medium text-sm truncate">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-gray-600 truncate">{user.email}</div>
                        </label>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
                      </div>
                    ))}
                    {filteredUsers.length === 0 && !selectedUser && (
                      <div className="p-2 text-gray-500 text-sm">No students found</div>
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

              {/* For driving lesson creation from here, product is optional/hidden */}
              {false && formData.studentId && (
                <>
                  <div>
                    <Label>Selected Product <span className="text-red-500">*</span></Label>
                    {/* {(() => {

                      return null;
                    })()} */}
                    <Select
                      value={formData.selectedProduct}
                      onValueChange={(value) => handleInputChange("selectedProduct", value)}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        {products.map((product) => (
                          <SelectItem key={product._id} value={product._id} className="hover:bg-gray-100">
                            {product.title} - ${product.price} ({product.duration} hrs)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Payment Status</Label>
                    <div className="flex space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="paid-true-lesson"
                          name="paid-lesson"
                          checked={formData.paid === true}
                          onChange={() => handleInputChange("paid", true)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="paid-true-lesson" className="text-sm cursor-pointer">
                          Paid
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="paid-false-lesson"
                          name="paid-lesson"
                          checked={formData.paid === false}
                          onChange={() => handleInputChange("paid", false)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="paid-false-lesson" className="text-sm cursor-pointer">
                          Not Paid
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}



          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            
            {isEditMode ? (
              <>

                <Button 
                  type="button" 
                  onClick={handleUpdate}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Updating..." : "Update"}
                </Button>
                <Button 
                  type="button" 
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </>
            ) : (
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                {loading ? "Creating..." : "Create Schedule"}
              </Button>
            )}
          </div>
        </form>
        </div> {/* Cierre del contenido scrollable */}
      </div> {/* Cierre del modal container */}
      
      {/* Conflict Modal */}
      {showConflictModal && conflictDetails && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Schedule Conflict Detected</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                There&apos;s already a <span className="font-semibold">{conflictDetails.type}</span> ({conflictDetails.status}) scheduled during this time.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="text-sm text-gray-600">
                  <div><span className="font-medium">Date:</span> {conflictDetails.date}</div>
                  <div><span className="font-medium">Time:</span> {conflictDetails.time}</div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm">
                Please choose a different time or date to avoid conflicts.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScheduleModal; 