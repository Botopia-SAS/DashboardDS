import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import useClassTypeStore from "@/app/store/classTypeStore";

interface Student {
  _id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface TicketFormData {
  _id?: string;
  date: string;
  hour: string;
  endHour: string;
  classId: string;
  type: string;
  duration: string;
  locationId: string;
  students: string[];
  spots: number;
  status: string;
  studentRequests: string[];
  recurrence?: string;
  recurrenceEndDate?: string;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TicketFormData) => void;
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
  initialData?: Partial<TicketFormData>;
  locations: { _id: string; title: string }[];
  classes: { _id: string; title: string; classType?: string }[];
  students?: Student[];
  selectedLocationId?: string;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onUpdate,
  initialData = {},
  classes = [],
  students = [],
  selectedLocationId,
}: ScheduleModalProps) {
  // Get the current class type from the store
  const { classType } = useClassTypeStore();

  // Calcular hora final por defecto (2 horas después de la inicial)
  function getDefaultEndHour(hour: string) {
    if (!hour) return "";
    const [h, m] = hour.split(":").map(Number);
    let endHour = h + 2;
    let endMinute = m;
    if (endHour >= 24) { endHour = 23; endMinute = 59; }
    return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
  }

  const [endHourTouched, setEndHourTouched] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const [form, setForm] = useState<TicketFormData>({
    _id: initialData?._id,
    date: initialData?.date || "",
    hour: initialData?.hour || "",
    endHour: initialData?.endHour || getDefaultEndHour(initialData?.hour || ""),
    classId: initialData?.classId || "",
    type: initialData?.type || classType,
    duration: initialData?.duration || "2h",
    locationId: initialData?.locationId || selectedLocationId || "",
    students: initialData?.students || [],
    spots: initialData?.spots || 30,
    status: initialData?.status || "available",
    studentRequests: initialData?.studentRequests || [],
    recurrence,
    recurrenceEndDate: recurrence !== "none" ? recurrenceEndDate : undefined,
  });



  useEffect(() => {
    if (isOpen) {
      // Normalizar estudiantes al cargar - convertir objetos a strings
      const normalizedStudents = initialData?.students
        ? normalizeStudents(initialData.students)
        : [];

      setForm({
        _id: initialData?._id,
        date: initialData?.date || "",
        hour: initialData?.hour || "",
        endHour: initialData?.endHour || getDefaultEndHour(initialData?.hour || ""),
        classId: initialData?.classId || "",
        type: initialData?.type || classType,
        duration: initialData?.duration || "2h",
        locationId: initialData?.locationId || selectedLocationId || "",
        students: normalizedStudents,
        spots: initialData?.spots || 30,
        status: initialData?.status || "available",
        studentRequests: initialData?.studentRequests || [],
        recurrence,
        recurrenceEndDate: recurrence !== "none" ? recurrenceEndDate : undefined,
      });
      // Si estamos editando un ticket existente (tiene _id), marcar endHour como tocada para evitar recálculo
      setEndHourTouched(initialData?._id ? true : false);
    }
  }, [isOpen, initialData, selectedLocationId, classType]);

  // Efecto separado para actualizar solo la recurrencia sin afectar otros campos
  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({
        ...prev,
        recurrence,
        recurrenceEndDate: recurrence !== "none" ? recurrenceEndDate : undefined,
      }));
    }
  }, [recurrence, recurrenceEndDate, isOpen]);

  // Efecto separado para actualizar el tipo de clase cuando cambie la pestaña activa
  useEffect(() => {
    // Actualizar el tipo de clase cuando cambie la pestaña, excepto si estamos editando un ticket existente
    if (isOpen && !initialData?._id) {
      setForm(prev => ({
        ...prev,
        type: classType
      }));
    }
  }, [classType, isOpen, initialData?._id]);

  useEffect(() => {
    // Solo auto-calcular endHour para nuevos tickets (sin _id) y cuando el usuario no haya tocado la hora final
    if (form.hour && !endHourTouched && !initialData?._id) {
      const defaultEnd = getDefaultEndHour(form.hour);
      setForm(prev => ({ ...prev, endHour: defaultEnd }));
    }
  }, [form.hour, endHourTouched, initialData?._id]);

  // Buscadores
  const [studentSearch, setStudentSearch] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const filteredStudents = students.filter((s) => {
    const search = studentSearch.toLowerCase();
    const name = (s.name || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    const firstName = (s.firstName || "").toLowerCase();
    const lastName = (s.lastName || "").toLowerCase();

    return name.includes(search) ||
           email.includes(search) ||
           firstName.includes(search) ||
           lastName.includes(search);
  });

  // Tipo para el estudiante en la base de datos
  type StudentInDB = string | {
    student_id?: string;
    studentId?: string;
    _id?: string
  };

  // Normalizar estudiantes - convertir objetos a strings
  const normalizeStudents = (students: StudentInDB[]): string[] => {
    return students.map((s) => {
      if (typeof s === 'string') {
        return s;
      }
      if (typeof s === 'object' && s !== null) {
        // Buscar en orden de prioridad: studentId, student_id, _id
        return s.studentId || s.student_id || s._id || '';
      }
      return '';
    }).filter(id => id !== '');
  };

  // Helper function to check if student is in the class
  // Handles both string IDs and objects with student_id/studentId/_id
  const isStudentInClass = (studentId: string, students: StudentInDB[]): boolean => {
    return students.some((s) => {
      // Si es un string, comparar directamente
      if (typeof s === 'string') {
        return s === studentId;
      }
      // Si es un objeto, buscar por studentId, student_id o _id
      if (typeof s === 'object' && s !== null) {
        return s.studentId === studentId || s.student_id === studentId || s._id === studentId;
      }
      return false;
    });
  };

  // Checkbox handlers
  const handleStudentCheck = (id: string) => {
    setForm((prev) => {
      const isCurrentlyInClass = isStudentInClass(id, prev.students);

      if (isCurrentlyInClass) {
        // Remover el estudiante - filtrar tanto strings como objetos
        return {
          ...prev,
          students: prev.students.filter((s: StudentInDB) => {
            if (typeof s === 'string') return s !== id;
            if (typeof s === 'object' && s !== null) {
              return s.studentId !== id && s.student_id !== id && s._id !== id;
            }
            return true;
          })
        };
      } else {
        // Agregar el estudiante como string ID
        return {
          ...prev,
          students: [...prev.students, id]
        };
      }
    });
  };

  // Cuando el usuario cambia la hora final manualmente, marcamos que la tocó
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value
      }));
      // Si el usuario cambia la hora final, marcamos que la tocó
      if (name === "endHour") {
        setEndHourTouched(true);
      }
      // Si el usuario cambia la hora de inicio, reseteamos el flag para que vuelva a autollenar la hora final
      if (name === "hour") {
        setEndHourTouched(false);
      }
      // Si el usuario cambia el tipo de clase, limpiar la clase seleccionada si no es válida para el nuevo tipo
      if (name === "type") {
        const selectedClass = classes.find(cls => cls._id === form.classId);
        if (selectedClass && selectedClass.classType !== value) {
          setForm((prev) => ({
            ...prev,
            type: value,
            classId: "" // Limpiar la clase seleccionada
          }));
          return; // Evitar el setForm duplicado
        }
      }
    }
  };

  // Helper function to normalize class type for comparison
  const normalizeClassType = (type: string) => {
    return type.toLowerCase().trim().replace(/\s+/g, '-');
  };

  // Filter classes based on the selected type in the form (case-insensitive and normalized)
  const filteredClasses = classes.filter(cls => {
    const clsType = normalizeClassType(cls.classType || '');
    const formType = normalizeClassType(form.type || '');
    const matches = clsType === formType;
    if (matches) {

    } else {

    }
    return matches;
  });


  // Función para verificar si el formulario es válido
  const isFormValid = () => {
    return (
      form.classId &&
      form.locationId &&
      form.hour &&
      form.endHour &&
      form.status &&
      form.hour < form.endHour
    );
  };

  const handleSave = async () => {
    const errors = [];
    if (!form.classId) errors.push("Driving Class is required");
    if (!form.hour) errors.push("Start Time is required");
    if (!form.endHour) errors.push("End Time is required");
    if (!form.status) errors.push("Status is required");
    if (form.hour >= form.endHour) errors.push("End Time must be after Start Time");
    if (recurrence !== "none" && !recurrenceEndDate) errors.push("Recurrence end date is required");

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    
    try {
      await onSave({
        ...form,
        recurrence,
        recurrenceEndDate: recurrence !== "none" ? recurrenceEndDate : undefined
      });
    } catch (error: unknown) {
      // Handle API errors (like instructor conflicts)
      if (error instanceof Error && error.message) {
        setValidationErrors([error.message]);
      } else {
        setValidationErrors(['Error creating ticket class. Please try again.']);
      }
    }
  };

  // --- Lógica de acciones ---
  // Update
  const handleUpdate = async () => {
    if (!form._id) return;

    // Validar el formulario antes de enviar
    const errors = [];
    if (!form.classId) errors.push("Driving Class is required");
    if (!form.hour) errors.push("Start Time is required");
    if (!form.endHour) errors.push("End Time is required");
    if (!form.status) errors.push("Status is required");
    if (form.hour >= form.endHour) errors.push("End Time must be after Start Time");

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    
    try {
      // Usar PUT real para mantener el mismo ID
      const updatePayload = {
        date: form.date,
        hour: form.hour,
        endHour: form.endHour,
        classId: form.classId,
        type: form.type,
        locationId: form.locationId,
        // Asegurar que students y studentRequests sean arrays de strings
        students: Array.isArray(form.students)
          ? form.students.filter(s => typeof s === 'string')
          : [],
        spots: form.spots,
        duration: form.duration,
        status: form.status,
        studentRequests: Array.isArray(form.studentRequests)
          ? form.studentRequests.filter(req => typeof req === 'string')
          : [],
      };

      const updateRes = await fetch(`/api/ticket/classes/${form._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!updateRes.ok) {
        let errorMessage = 'Error updating TicketClass';
        try {
          const errorData = await updateRes.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Si no es JSON válido, usar el status text
          errorMessage = `HTTP ${updateRes.status}: ${updateRes.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Verificar que la respuesta tenga contenido JSON válido
      const responseText = await updateRes.text();
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      
      try {
        JSON.parse(responseText);
      } catch {
        console.error('Invalid JSON response:', responseText);
        throw new Error('Invalid response format from server');
      }

      // Cerrar el modal y refrescar el calendario sin alerts de éxito
      onClose();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Update error:', err);
      alert(`Error updating TicketClass: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!form._id) return;
    if (typeof onDelete === 'function') {
      await onDelete(form._id);
    }
  };



  // Create Another Class (para clases existentes) - Keep time configuration
  const handleCreateAnother = () => {
    // Resetear el formulario pero mantener tiempo y configuración básica
    const newForm = {
      ...form,
      _id: undefined,
      students: [],
      studentRequests: [],
      status: "available",
      classId: "", // Reset class selection to force user to choose a new class
      // Keep: date, hour, endHour, type, spots, locationId, duration
    };

    setForm(newForm);
    setValidationErrors([]);
    setStudentSearch(""); // Clear student search
  };



  // Forzar que el modal aparezca después de cerrar el modal principal
  useEffect(() => {
    if (showCopyModal) {
      // Pequeño delay para asegurar que el modal principal se cierre primero
      const timer = setTimeout(() => {
        setShowCopyModal(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showCopyModal]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white p-3 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col relative">
          <h2 className="text-sm font-bold mb-1 flex-shrink-0">
            Configure TicketClass
            {form.date && (
              <span className="block text-xs font-normal mt-0.5">
                {`Date: ${new Date(form.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}`}
                {form.hour && (
                  <span className="ml-2 text-blue-600">
                    {`Start: ${form.hour}`}
                  </span>
                )}
              </span>
            )}
          </h2>

          {validationErrors.length > 0 && (
            <div className="mb-1 p-1.5 bg-red-50 border border-red-200 rounded-md flex-shrink-0">
              <h3 className="text-xs font-medium text-red-800 mb-0.5">Please fix the following errors:</h3>
              <ul className="text-xs text-red-700 space-y-0.5">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">Class type <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none bg-gray-100 text-gray-700 font-semibold uppercase"
                    value={form.type}
                    disabled={true}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">Spots</label>
                  <input
                    type="number"
                    name="spots"
                    value={form.spots}
                    onChange={handleChange}
                    className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">Start Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    name="hour"
                    value={form.hour}
                    onChange={handleChange}
                    className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">End Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    name="endHour"
                    value={form.endHour}
                    onChange={handleChange}
                    className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">Driving Class <span className="text-red-500">*</span></label>
                  <select
                    className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    name="classId"
                    value={form.classId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select class</option>
                    {filteredClasses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">Recurrence</label>
                  <select
                    className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              
              {recurrence !== "none" && (
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-0.5">Recurrence End Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min={form.date}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-0.5">Status <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {[
                    { value: 'available', label: 'Available' },
                    { value: 'cancel', label: 'Cancelled' },
                    { value: 'full', label: 'Full' },
                    { value: 'expired', label: 'Expired' }
                  ].map((status) => (
                    <label key={status.value} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={status.value}
                        checked={form.status === status.value}
                        onChange={handleChange}
                        className="w-3 h-3"
                      />
                      <span className="truncate">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.status === 'available' && (
                <div>
                  <label className="block text-xs font-medium mb-0.5">Students</label>
                  <input
                    type="text"
                    placeholder="Search by name, email, first/last name..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="w-full border rounded px-1.5 py-1 text-xs mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="max-h-40 overflow-y-auto border rounded px-1.5 py-1 bg-gray-50 space-y-0.5">
                    {filteredStudents.length === 0 && <div className="text-xs text-gray-400 py-1">No students found</div>}
                    {filteredStudents.map((s) => (
                      <label key={s._id} className="flex items-center justify-between py-1.5 cursor-pointer text-xs hover:bg-gray-100 rounded px-1.5 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{s.name}</div>
                          {s.email && (
                            <div className="text-gray-500 text-[10px] truncate">{s.email}</div>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isStudentInClass(s._id, form.students)}
                          onChange={() => handleStudentCheck(s._id)}
                          className="ml-2 w-4 h-4 flex-shrink-0"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-wrap justify-end gap-1 mt-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs px-2 py-1 h-auto"
            >
              Cancel
            </Button>
            {form._id ? (
              <>
                <Button
                  onClick={handleUpdate}
                  disabled={!isFormValid()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-auto"
                >
                  Update
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-auto"
                >
                  Delete
                </Button>
                <Button
                  onClick={handleCreateAnother}
                  disabled={!isFormValid()}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-auto"
                >
                  + Another
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  disabled={!isFormValid()}
                  className={`text-xs px-2 py-1 h-auto ${isFormValid()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  Create
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
} 