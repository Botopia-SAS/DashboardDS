import { useState } from "react";

export default function ScheduleEmailPanel() {
  const [date, setDate] = useState("");
  const [email, setEmail] = useState("");
  const [template, setTemplate] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Simulación de plantillas y destinatarios (puedes conectar a tu API real)
  const templates = [
    { id: "1", name: "Class Reminder" },
    { id: "2", name: "Welcome New Student" },
    { id: "3", name: "General Class Assignment" },
  ];
  const recipients = [
    "student1@email.com",
    "student2@email.com",
    "instructor1@email.com",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    // Aquí iría la lógica real para programar el correo
    setTimeout(() => {
      setLoading(false);
      setSuccess("Email scheduled successfully!");
      setDate("");
      setEmail("");
      setTemplate("");
    }, 1200);
  };

  return (
    <aside className="bg-white rounded shadow p-4 h-full flex flex-col justify-between">
      <h2 className="text-lg font-bold mb-2 text-blue-700">Schedule Email</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient</label>
          <select
            className="border rounded p-2 w-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          >
            <option value="">Select recipient</option>
            {recipients.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Template</label>
          <select
            className="border rounded p-2 w-full"
            value={template}
            onChange={e => setTemplate(e.target.value)}
            required
          >
            <option value="">Select template</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date & Time</label>
          <input
            type="datetime-local"
            className="border rounded p-2 w-full"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold mt-2 hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Scheduling..." : "Schedule Email"}
        </button>
        {success && <div className="text-green-600 font-semibold mt-2">{success}</div>}
      </form>
      <div className="text-xs text-gray-400 mt-4">* This feature is for scheduling emails to be sent at a future date and time.</div>
    </aside>
  );
} 