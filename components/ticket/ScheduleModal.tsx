import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface Instructor {
  _id: string;
  name: string;
  canTeachTicketClass?: boolean;
}

interface Student {
  _id: string;
  name: string;
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
  instructorId: string;
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
  instructors: Instructor[];
  locations: { _id: string; title: string }[];
  classes: { _id: string; title: string }[];
  students?: Student[];
}

const recurrenceOptions = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onUpdate,
  initialData = {},
  instructors = [],
  locations = [],
  classes = [],
  students = [],
}: ScheduleModalProps) {
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
    type: initialData?.type || "date",
    duration: initialData?.duration || "2h",
    locationId: initialData?.locationId || "",
    instructorId: initialData?.instructorId || "",
    students: initialData?.students || [],
    spots: initialData?.spots || 30,
    status: initialData?.status || "available",
    studentRequests: initialData?.studentRequests || [],
    recurrence,
    recurrenceEndDate: recurrence !== "none" ? recurrenceEndDate : undefined,
  });

  // Debug: monitorear cuando cambia showCopyModal
  useEffect(() => {
    //console.log('showCopyModal changed to:', showCopyModal);
  }, [showCopyModal]);

  useEffect(() => {
    if (isOpen) {
      setForm({
        _id: initialData?._id,
        date: initialData?.date || "",
        hour: initialData?.hour || "",
        endHour: initialData?.endHour || getDefaultEndHour(initialData?.hour || ""),
        classId: initialData?.classId || "",
        type: initialData?.type || "date",
        duration: initialData?.duration || "2h",
        locationId: initialData?.locationId || "",
        instructorId: initialData?.instructorId || "",
        students: initialData?.students || [],
        spots: initialData?.spots || 30,
        status: initialData?.status || "available",
        studentRequests: initialData?.studentRequests || [],
        recurrence,
        recurrenceEndDate: recurrence !== "none" ? recurrenceEndDate : undefined,
      });
      setEndHourTouched(false);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (form.hour && !endHourTouched) {
      const defaultEnd = getDefaultEndHour(form.hour);
      setForm(prev => ({ ...prev, endHour: defaultEnd }));
    }
  }, [form.hour, endHourTouched]);

  // Buscadores
  const [instructorSearch, setInstructorSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const filteredInstructors = instructors
    .filter((i) => i.canTeachTicketClass === true) // Solo instructores que pueden enseñar ticket class
    .filter((i) =>
      (i.name || "").toLowerCase().includes(instructorSearch.toLowerCase())
    );
  const filteredStudents = students.filter((s) =>
    (s.name || "").toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Checkbox handlers
  const handleInstructorCheck = (id: string) => {
    setForm((prev) => ({
      ...prev,
      instructorId: prev.instructorId === id ? "" : id,
    }));
  };
  const handleStudentCheck = (id: string) => {
    setForm((prev) => ({
      ...prev,
      students: prev.students.includes(id)
        ? prev.students.filter((s: string) => s !== id)
        : [...prev.students, id],
    }));
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
    }
  };

  // Función para verificar si el formulario es válido
  const isFormValid = () => {
    return (
      form.classId &&
      form.locationId &&
      form.hour &&
      form.endHour &&
      form.instructorId &&
      form.status &&
      form.hour < form.endHour
    );
  };

  const handleSave = () => {
    const errors = [];
    if (!form.classId) errors.push("Driving Class is required");
    if (!form.locationId) errors.push("Location is required");
    if (!form.hour) errors.push("Start Time is required");
    if (!form.endHour) errors.push("End Time is required");
    if (!form.instructorId) errors.push("You must select a valid instructor");
    if (!form.status) errors.push("Status is required");
    if (form.hour >= form.endHour) errors.push("End Time must be after Start Time");
    if (recurrence !== "none" && !recurrenceEndDate) errors.push("Recurrence end date is required");

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    onSave({
      ...form,
      recurrence,
      recurrenceEndDate: recurrence !== "none" ? recurrenceEndDate : undefined
    });
  };

  // --- Lógica de acciones ---
  // Update
  const handleUpdate = async () => {
    if (!form._id) return;
    
    // Validar el formulario antes de enviar
    const errors = [];
    if (!form.classId) errors.push("Driving Class is required");
    if (!form.locationId) errors.push("Location is required");
    if (!form.hour) errors.push("Start Time is required");
    if (!form.endHour) errors.push("End Time is required");
    if (!form.instructorId) errors.push("You must select a valid instructor");
    if (!form.status) errors.push("Status is required");
    if (form.hour >= form.endHour) errors.push("End Time must be after Start Time");

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    
    try {
      // Estrategia 'delete and recreate' para evitar incompatibilidades de tipos en backend
      const delRes = await fetch(`/api/ticket/classes/${form._id}`, { method: 'DELETE' });
      // Si no existe, continuamos de todas formas con el create
      if (!delRes.ok && delRes.status !== 404) {
        const errorData = await delRes.json();
        throw new Error(errorData.error || 'Error deleting existing TicketClass');
      }

      const createPayload = {
        // enviar fecha en formato YYYY-MM-DD (el API la normaliza)
        date: form.date,
        hour: form.hour,
        endHour: form.endHour,
        classId: form.classId,
        type: form.type,
        locationId: form.locationId,
        instructorId: form.instructorId,
        students: form.students,
        spots: form.spots,
        duration: form.duration,
        // status no está permitido por el schema de POST
        studentRequests: form.studentRequests || [],
      };

      const createRes = await fetch('/api/ticket/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.error || 'Error creating TicketClass');
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

  // Copy (guarda en clipboard global)
  const handleCopy = () => {
    const copyData = { ...form };
    delete copyData._id;
    window.localStorage.setItem('ticketclass_clipboard', JSON.stringify(copyData));
    setShowCopyModal(true);
    onClose();
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
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full mt-4">
        <h2 className="text-lg font-bold mb-2">
          Configure TicketClass
          {form.date && (
            <span className="block text-sm font-normal mt-1">
              {`Date: ${form.date}`}
              {form.hour && (
                <span className="ml-2 text-blue-600">
                  {`Start: ${form.hour}`}
                </span>
              )}
            </span>
          )}
        </h2>
        
        {validationErrors.length > 0 && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-2">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Class type <span className="text-red-500">*</span></label>
              <select
                className="w-full border rounded px-2 py-1"
                name="type"
                value={form.type}
                onChange={handleChange}
                required
              >
                <option value="date">D.A.T.E</option>
                <option value="bdi">B.D.I</option>
                <option value="adi">A.D.I</option>
              </select>
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">Spots</label>
              <input type="number" name="spots" value={form.spots} onChange={handleChange} className="w-full border rounded px-2 py-1" min={1} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Driving Class <span className="text-red-500">*</span></label>
            <select
              className="w-full border rounded px-2 py-1"
              name="classId"
              value={form.classId}
              onChange={handleChange}
              required
            >
              <option value="">Select class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location <span className="text-red-500">*</span></label>
            <select
              className="w-full border rounded px-2 py-1"
              name="locationId"
              value={form.locationId}
              onChange={handleChange}
              required
            >
              <option value="">Select location</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time <span className="text-red-500">*</span></label>
              <input 
                type="time" 
                name="hour" 
                value={form.hour} 
                onChange={handleChange} 
                className="w-full border rounded px-2 py-1" 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time <span className="text-red-500">*</span></label>
              <input 
                type="time" 
                name="endHour" 
                value={form.endHour} 
                onChange={handleChange} 
                className="w-full border rounded px-2 py-1" 
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recurrence</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {recurrence !== "none" && (
            <div>
              <label className="block text-sm font-medium mb-1">Recurrence End Date</label>
              <input
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                className="w-full border rounded px-2 py-1"
                min={form.date}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Instructors <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Search instructor..."
              value={instructorSearch}
              onChange={e => setInstructorSearch(e.target.value)}
              className="w-full border rounded px-2 py-1 mb-2"
            />
            <div className="max-h-12 overflow-y-auto border rounded px-2 py-1 bg-gray-50">
              {filteredInstructors.length === 0 && <div className="text-xs text-gray-400">No instructors found</div>}
              {filteredInstructors.map((i) => (
                <label key={i._id} className="flex items-center justify-between py-1 cursor-pointer text-sm">
                  <span>{i.name}</span>
                  <input
                    type="checkbox"
                    checked={form.instructorId === i._id}
                    onChange={() => handleInstructorCheck(i._id)}
                  />
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status <span className="text-red-500">*</span></label>
            <div className="flex gap-4 mt-1">
              {[
                { value: 'available', label: 'Available' },
                { value: 'cancel', label: 'Cancelled' },
                { value: 'full', label: 'Full' },
                { value: 'expired', label: 'Expired' }
              ].map((status) => (
                <label key={status.value} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={form.status === status.value}
                    onChange={handleChange}
                  />
                  {status.label}
                </label>
              ))}
            </div>
          </div>
          {form.status === 'available' && (
            <div>
              <label className="block text-sm font-medium mb-1">Students</label>
              <input
                type="text"
                placeholder="Search student..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full border rounded px-2 py-1 mb-2"
              />
              <div className="max-h-12 overflow-y-auto border rounded px-2 py-1 bg-gray-50">
                {filteredStudents.length === 0 && <div className="text-xs text-gray-400">No students found</div>}
                {filteredStudents.map((s) => (
                  <label key={s._id} className="flex items-center justify-between py-1 cursor-pointer text-sm">
                    <span>{s.name}</span>
                    <input
                      type="checkbox"
                      checked={form.students.includes(s._id)}
                      onChange={() => handleStudentCheck(s._id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {form._id ? (
            <>
              <Button
                onClick={handleUpdate}
                disabled={!isFormValid()}
                className={`bg-blue-600 hover:bg-blue-700 text-white`}
              >
                Update
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
              <Button
                onClick={handleCopy}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                Copy
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={!isFormValid()}
              className={`
                ${isFormValid() 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-300 text-gray-700 cursor-not-allowed'}
              `}
            >
              Create TicketClass
            </Button>
          )}
        </div>
      </div>
      {/* Modal bonito para copy - FUERA del modal principal */}
      <Dialog open={showCopyModal} onClose={() => setShowCopyModal(false)} className="fixed inset-0 flex items-center justify-center z-[9999]">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4 text-center border border-gray-100">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Class copied!</h2>
            <p className="text-gray-600 text-lg">Go to the calendar and press <span className="bg-gray-100 px-2 py-1 rounded font-mono text-sm font-bold">Ctrl+V</span> on a slot to paste it.</p>
          </div>
          <Button 
            onClick={() => setShowCopyModal(false)} 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Got it!
          </Button>
        </div>
      </Dialog>
    </Dialog>
  );
} 