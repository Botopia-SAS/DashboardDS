"use client";
import React, { useEffect, useState, FormEvent, ChangeEvent, useRef } from "react";
import Calendar from "./calendar";
import { enUS } from "date-fns/locale";
import { toZonedTime, format } from "date-fns-tz";

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
}

interface Instructor {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
}

interface DBTemplate {
  _id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
}

const TEMPLATES: DBTemplate[] = [
  {
    _id: "reminder",
    name: "Class Reminder",
    type: "student",
    subject: "Class Reminder",
    body: `Hello, {{name}}!\nThis is a reminder that you have a driving class scheduled soon. Please be on time and bring all required documents.`,
  },
  {
    _id: "custom",
    name: "Custom Message",
    type: "student",
    subject: "",
    body: "",
  },
];

const CUSTOM_TEMPLATE: DBTemplate = {
  _id: "custom",
  name: "Custom Message",
  type: "student",
  subject: "",
  body: "",
};

// Función auxiliar para convertir hora local de Miami a UTC
function miamiLocalToUTC(date: Date, hour: string, minute: string) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const miamiString = `${year}-${month}-${day}T${hour}:${minute}:00`;
  // Creamos la fecha como si fuera local de Miami
  // Obtenemos el offset real de Miami para esa fecha
  // Usamos Intl.DateTimeFormat para obtener la hora UTC equivalente
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date(miamiString));
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  const h = parts.find(p => p.type === 'hour')?.value;
  const min = parts.find(p => p.type === 'minute')?.value;
  const s = parts.find(p => p.type === 'second')?.value;
  // Construimos la fecha UTC
  return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`);
}

export default function ContactForm() {
  const [users, setUsers] = useState<User[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [recipientType, setRecipientType] = useState("users");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(true);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [dbTemplates, setDbTemplates] = useState<DBTemplate[]>([]);
  const [greeting, setGreeting] = useState<string>("Hello");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempHour, setTempHour] = useState<string>("00");
  const [tempMinute, setTempMinute] = useState<string>("00");
  const [miamiNow, setMiamiNow] = useState(toZonedTime(new Date(), "America/New_York"));

  useEffect(() => {
    fetch("/api/users?roles=user")
      .then((res) => res.json())
      .then(setUsers);
    fetch("/api/instructors")
      .then((res) => res.json())
      .then(setInstructors);
  }, []);

  useEffect(() => {
    const cleanBody = template.body.replace(/^.*{{name}}.*[\n\r]+/, "");
    setSubject(template.subject);
    setBody(cleanBody);
  }, [template]);

  useEffect(() => {
    fetch("/api/email/templates")
      .then((res) => res.json())
      .then(setDbTemplates);
  }, []);

  useEffect(() => {
    const reloadTemplates = () => {
      fetch("/api/email/templates")
        .then((res) => res.json())
        .then(setDbTemplates);
    };
    window.addEventListener("template-created", reloadTemplates);
    return () => window.removeEventListener("template-created", reloadTemplates);
  }, []);

  // Reset selection when type changes
  useEffect(() => {
    const list = recipientType === "users" ? users : instructors;
    setSelectedRecipients(list.map((r) => r._id));
    setAllSelected(true);
  }, [recipientType, users, instructors]);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Escuchar selección de plantilla desde el panel
  useEffect(() => {
    function handleSelectTemplate(e: any) {
      const tpl = e.detail;
      setSubject(tpl.subject);
      setBody(tpl.body);
      setTemplate({ _id: tpl._id, name: tpl.name, subject: tpl.subject, body: tpl.body, type: tpl.type });
    }
    window.addEventListener("select-template", handleSelectTemplate);
    return () => window.removeEventListener("select-template", handleSelectTemplate);
  }, [template]);

  useEffect(() => {
    if (showScheduleModal) {
      // Al abrir el modal, setear la hora de Miami como default
      const nowMiami = toZonedTime(new Date(), "America/New_York");
      setMiamiNow(nowMiami);
      setTempDate(nowMiami);
      setTempHour(format(nowMiami, "HH"));
      setTempMinute(format(nowMiami, "mm"));
      setScheduledDate("");
    }
  }, [showScheduleModal]);

  // Actualizar la hora de Miami cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setMiamiNow(toZonedTime(new Date(), "America/New_York"));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRecipientChange = (id: string) => {
    if (selectedRecipients.includes(id)) {
      const newSelected = selectedRecipients.filter((rid) => rid !== id);
      setSelectedRecipients(newSelected);
      setAllSelected(false);
    } else {
      const list = recipientType === "users" ? users : instructors;
      const newSelected = [...selectedRecipients, id];
      setSelectedRecipients(newSelected);
      if (newSelected.length === list.length) setAllSelected(true);
    }
  };

  const handleAllChange = () => {
    const list = recipientType === "users" ? users : instructors;
    if (allSelected) {
      setSelectedRecipients([]);
      setAllSelected(false);
    } else {
      setSelectedRecipients(list.map((r) => r._id));
      setAllSelected(true);
    }
  };

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    let recipients: (User | Instructor)[] = [];
    const list = recipientType === "users" ? users : instructors;
    recipients = list.filter((r) => selectedRecipients.includes(r._id));
    if (recipients.length === 0) {
      setError("Please select at least one recipient.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          subject,
          body,
          templateId: template._id,
          greeting,
        }),
      });
      if (res.ok) {
        setSuccess("Emails sent successfully!");
        window.alert("Email sent successfully!");
        // Reset all fields to default
        setRecipientType("users");
        setSelectedRecipients([]);
        setAllSelected(true);
        setTemplate(CUSTOM_TEMPLATE);
        setSubject(CUSTOM_TEMPLATE.subject);
        setBody(CUSTOM_TEMPLATE.body);
        setGreeting("Hello");
        setSearch("");
      } else setError("Failed to send emails");
    } catch {
      setError("Failed to send emails");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSend = async (
    e?: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.preventDefault?.();
    setLoading(true);
    setSuccess("");
    setError("");
    let recipients: (User | Instructor)[] = [];
    const list = recipientType === "users" ? users : instructors;
    recipients = list.filter((r) => selectedRecipients.includes(r._id));
    if (recipients.length === 0) {
      setError("Please select at least one recipient.");
      setLoading(false);
      return;
    }
    if (!scheduledDate) {
      setError("Please select a date and time.");
      setLoading(false);
      return;
    }
    try {
      // Solo enviar los emails
      const emails = recipients.map(r => r.email);
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: emails,
          subject,
          body,
          scheduledDate,
        }),
      });
      if (res.ok) {
        setScheduleSuccess("Email scheduled successfully!");
        setTimeout(() => {
          setShowScheduleModal(false);
          setScheduleSuccess("");
          setRecipientType("users");
          setSelectedRecipients([]);
          setAllSelected(true);
          setTemplate(CUSTOM_TEMPLATE);
          setSubject(CUSTOM_TEMPLATE.subject);
          setBody(CUSTOM_TEMPLATE.body);
          setGreeting("Hello");
          setSearch("");
          setScheduledDate("");
        }, 1500);
      } else setError("Failed to schedule email");
    } catch {
      setError("Failed to schedule email");
    } finally {
      setLoading(false);
    }
  };

  const list = recipientType === "users" ? users : instructors;
  const filteredList = list.filter((r) => {
    const term = search.toLowerCase();
    return (
      (r.firstName && `${r.firstName} ${r.lastName}`.toLowerCase().includes(term)) ||
      (r.name && r.name.toLowerCase().includes(term)) ||
      r.email.toLowerCase().includes(term)
    );
  });

  // Determinar el tipo de template a mostrar
  const templateType = recipientType === "users" ? "student" : "instructor";
  const filteredTemplates = dbTemplates.filter(t => t.type === templateType);
  const templateOptions = [
    ...filteredTemplates,
    CUSTOM_TEMPLATE,
  ];

  // Cambiar el template seleccionado
  const handleTemplateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = templateOptions.find(t => t._id === e.target.value) || CUSTOM_TEMPLATE;
    setTemplate(selected);
  };

  // Determinar el nombre visual para el saludo
  let visualName = "";
  if (recipientType === "users") {
    if (selectedRecipients.length === 1 && users.length > 0) {
      const user = users.find(u => u._id === selectedRecipients[0]);
      visualName = user ? `${user.firstName || user.name}` : "Student";
    } else {
      visualName = "Student";
    }
  } else {
    if (selectedRecipients.length === 1 && instructors.length > 0) {
      const inst = instructors.find(i => i._id === selectedRecipients[0]);
      visualName = inst ? `${inst.firstName || inst.name}` : "Instructor";
    } else {
      visualName = "Instructor";
    }
  }

  // Mostrar la hora seleccionada en Miami y UTC aunque no se haya confirmado aún
  function getSelectedMiamiAndUTC(date: Date | null, hour: string, minute: string) {
    if (!date) return { selectedMiami: null, selectedUTC: null };
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const miamiString = `${year}-${month}-${day}T${hour}:${minute}:00`;
    // Convierte la hora local de Miami a UTC correctamente
    const utcDate = miamiLocalToUTC(date, hour, minute);
    return { selectedMiami: miamiString, selectedUTC: utcDate };
  }
  const { selectedMiami, selectedUTC } = getSelectedMiamiAndUTC(tempDate, tempHour, tempMinute);

  return (
    <form onSubmit={handleSend} className="space-y-6 w-full">
      <div>
        <label className="block font-semibold mb-1">Recipient Type</label>
        <select value={recipientType} onChange={(e: ChangeEvent<HTMLSelectElement>) => { setRecipientType(e.target.value); }} className="border rounded p-2 w-full">
          <option value="users">Users</option>
          <option value="instructors">Instructors</option>
        </select>
      </div>
      <div>
        <label className="block font-semibold mb-1">Recipient</label>
        <div className="relative w-full" ref={dropdownRef}>
          <button
            type="button"
            className="border rounded p-2 w-full text-left bg-gray-50"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            {allSelected
              ? "All"
              : selectedRecipients.length === 0
              ? "Select recipients"
              : selectedRecipients.length === 1
              ? list.find((r) => r._id === selectedRecipients[0])?.firstName || list.find((r) => r._id === selectedRecipients[0])?.name
              : `${selectedRecipients.length} selected`}
          </button>
          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow" style={{ minWidth: 300 }}>
              <div className="p-2">
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={allSelected} onChange={handleAllChange} className="mr-2" />
                  All
                </label>
              </div>
              <div className="px-2 pb-2">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border-t" style={{ marginBottom: 56 }}>
                {filteredList.map((r) => (
                  <div key={r._id} className="px-2 py-1 hover:bg-gray-100 rounded">
                    <label className="inline-flex items-center w-full">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(r._id)}
                        onChange={() => handleRecipientChange(r._id)}
                        className="mr-2"
                      />
                      <span className="truncate">{r.firstName ? `${r.firstName} ${r.lastName}` : r.name} ({r.email})</span>
                    </label>
                  </div>
                ))}
                {filteredList.length === 0 && (
                  <div className="px-2 py-2 text-gray-400 text-sm">No results</div>
                )}
              </div>
              <div className="absolute left-0 bottom-0 w-full p-2 bg-white border-t shadow-[0_-2px_8px_-4px_rgba(0,0,0,0.08)] flex justify-end z-20">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-4 py-1 rounded"
                  onClick={() => setDropdownOpen(false)}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-1">Template</label>
        <select value={template._id} onChange={handleTemplateChange} className="border rounded p-2 w-full">
          {templateOptions.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-semibold mb-1">Subject</label>
        <input value={subject} onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} className="border rounded p-2 w-full" required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Greeting</label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          value={greeting}
          onChange={e => setGreeting(e.target.value)}
          placeholder="Greeting (e.g. Hello, Hi, Dear)"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Body</label>
        <textarea value={body} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)} className="border rounded p-2 w-full" style={{minHeight: 120}} placeholder="Write your custom message here..." />
        <div className="mt-2 text-blue-700 text-sm flex items-center gap-2">
          <span className="inline-block bg-blue-100 px-2 py-0.5 rounded font-semibold">
            All emails will include a personalized greeting to the recipient, even if not shown in the body above.
          </span>
          <span className="font-mono">{greeting}, <b>{selectedRecipients.length > 1 ? (recipientType === "users" ? "Student" : "Instructor") : visualName}</b>!</span>
        </div>
      </div>
      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold w-full" disabled={loading}>{loading ? "Sending..." : "Send Email"}</button>
      <button type="button" className="bg-purple-600 text-white px-6 py-2 rounded font-semibold w-full mt-2" onClick={() => setShowScheduleModal(true)}>
        Schedule Email
      </button>
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Schedule Email</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Date & Time</label>
                <div className="mb-2 text-xs text-blue-700">
                  <b>Current Miami time:</b> {format(miamiNow, "yyyy-MM-dd HH:mm")} (America/New_York)
                </div>
                {selectedMiami && (
                  <div className="mb-2 text-xs text-green-700">
                    <b>Scheduled Miami time:</b> {selectedMiami.replace('T', ' ').slice(0, 16)}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    className="border rounded p-2 w-full"
                    value={scheduledDate ? format(toZonedTime(new Date(scheduledDate), "America/New_York"), "yyyy-MM-dd HH:mm") : "Select date and time..."}
                    readOnly
                    onClick={() => setShowCalendar(true)}
                  />
                  {showCalendar && (
                    <div className="z-50 bg-white rounded shadow p-4">
                      <Calendar
                        onSelect={date => setTempDate(date)}
                        locale={enUS}
                      />
                      <div className="flex gap-2 mt-2">
                        <select value={tempHour} onChange={e => setTempHour(e.target.value)} className="border rounded p-2">
                          {[...Array(24).keys()].map(h => (
                            <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <span className="self-center">:</span>
                        <select value={tempMinute} onChange={e => setTempMinute(e.target.value)} className="border rounded p-2">
                          {[...Array(60).keys()].map(m => (
                            <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          className="bg-blue-600 text-white px-4 py-2 rounded"
                          onClick={() => {
                            if (tempDate) {
                              // Construir fecha en zona de Miami y convertir a UTC ISO
                              const year = tempDate.getFullYear();
                              const month = (tempDate.getMonth() + 1).toString().padStart(2, '0');
                              const day = tempDate.getDate().toString().padStart(2, '0');
                              const miamiString = `${year}-${month}-${day}T${tempHour}:${tempMinute}:00-04:00`;
                              // Guardar como UTC ISO
                              const utcDate = new Date(miamiString);
                              setScheduledDate(utcDate.toISOString().slice(0,16));
                            }
                            setShowCalendar(false);
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {scheduleSuccess && (
                <div className="text-green-600 font-semibold text-center">{scheduleSuccess}</div>
              )}
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 rounded border" onClick={() => { setShowScheduleModal(false); setScheduleSuccess(""); }}>Cancel</button>
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-purple-600 text-white shadow"
                  disabled={loading || !!scheduleSuccess}
                  onClick={handleScheduleSend}
                >
                  Confirm Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {success && <div className="text-green-600 font-semibold">{success}</div>}
      {error && <div className="text-red-600 font-semibold">{error}</div>}
    </form>
  );
} 