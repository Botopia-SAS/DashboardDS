"use client";
import { useEffect, useState } from "react";

const TEMPLATES = [
  {
    id: "reminder",
    name: "Class Reminder",
    subject: "Class Reminder",
    body: `Hello, {{name}}!\nThis is a reminder that you have a driving class scheduled soon. Please be on time and bring all required documents.`,
  },
  {
    id: "custom",
    name: "Custom Message",
    subject: "",
    body: "",
  },
];

export default function ContactForm() {
  const [users, setUsers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [recipientType, setRecipientType] = useState("users");
  const [recipient, setRecipient] = useState("all");
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users?roles=user")
      .then((res) => res.json())
      .then(setUsers);
    fetch("/api/instructors")
      .then((res) => res.json())
      .then(setInstructors);
  }, []);

  useEffect(() => {
    setSubject(template.subject);
    setBody(template.body);
  }, [template]);

  const handleSend = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    let recipients = [];
    if (recipientType === "users") {
      recipients = recipient === "all" ? users : users.filter((u: any) => u._id === recipient);
    } else {
      recipients = recipient === "all" ? instructors : instructors.filter((i: any) => i._id === recipient);
    }
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          subject,
          body,
          templateId: template.id,
        }),
      });
      if (res.ok) setSuccess("Emails sent successfully!");
      else setError("Failed to send emails");
    } catch {
      setError("Failed to send emails");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="space-y-6 bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <div>
        <label className="block font-semibold mb-1">Recipient Type</label>
        <select value={recipientType} onChange={e => { setRecipientType(e.target.value); setRecipient("all"); }} className="border rounded p-2 w-full">
          <option value="users">Users</option>
          <option value="instructors">Instructors</option>
        </select>
      </div>
      <div>
        <label className="block font-semibold mb-1">Recipient</label>
        <select value={recipient} onChange={e => setRecipient(e.target.value)} className="border rounded p-2 w-full">
          <option value="all">All</option>
          {(recipientType === "users" ? users : instructors).map((r: any) => (
            <option key={r._id} value={r._id}>{r.firstName ? `${r.firstName} ${r.lastName}` : r.name} ({r.email})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-semibold mb-1">Template</label>
        <select value={template.id} onChange={e => setTemplate(TEMPLATES.find(t => t.id === e.target.value) || TEMPLATES[0])} className="border rounded p-2 w-full">
          {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-semibold mb-1">Subject</label>
        <input value={subject} onChange={e => setSubject(e.target.value)} className="border rounded p-2 w-full" required />
      </div>
      <div>
        <label className="block font-semibold mb-1">Body</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} className="border rounded p-2 w-full min-h-[120px]" required />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold" disabled={loading}>{loading ? "Sending..." : "Send Email"}</button>
      {success && <div className="text-green-600 font-semibold">{success}</div>}
      {error && <div className="text-red-600 font-semibold">{error}</div>}
    </form>
  );
} 