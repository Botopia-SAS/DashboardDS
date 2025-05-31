import { useEffect, useState } from "react";

interface Template {
  _id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
}

export default function TemplatesPanel() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: "", type: "student", subject: "", body: "" });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email/templates");
      const data = await res.json();
      setTemplates(data);
    } catch {
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSelect = (tpl: Template) => {
    // Dispara un evento personalizado para que ContactForm lo escuche
    window.dispatchEvent(new CustomEvent("select-template", { detail: tpl }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch("/api/email/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchTemplates();
    window.dispatchEvent(new Event("template-created"));
  };

  const handleEdit = (tpl: Template) => {
    setEditTemplate(tpl);
    setForm({ name: tpl.name, type: tpl.type, subject: tpl.subject, body: tpl.body });
    setShowForm(true);
  };

  const handleNew = () => {
    setForm({ name: "", type: "student", subject: "", body: "" });
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editTemplate) {
      await fetch("/api/email/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTemplate._id, ...form }),
      });
      window.dispatchEvent(new Event("template-created"));
    } else {
      await fetch("/api/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      window.dispatchEvent(new Event("template-created"));
    }
    setShowForm(false);
    fetchTemplates();
    setEditTemplate(null);
  };

  return (
    <aside className="bg-white rounded shadow p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>Templates</span>
          <span className="text-xs text-gray-400 font-normal">(Student & Instructor)</span>
        </h2>
        <button className="bg-blue-500 text-white px-2 py-1 rounded text-sm shadow hover:bg-blue-600 transition" onClick={handleNew}>New</button>
      </div>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <ul className="space-y-2 flex-1 overflow-y-auto">
          {templates.map((tpl) => (
            <li key={tpl._id} className="border rounded p-2 hover:bg-blue-50 cursor-pointer group flex flex-col gap-1">
              <div className="flex items-center gap-2" onClick={() => handleSelect(tpl)}>
                <div className={`font-semibold group-hover:underline ${tpl.type === 'student' ? 'text-green-700' : 'text-purple-700'}`}>{tpl.name}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${tpl.type === 'student' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{tpl.type.charAt(0).toUpperCase() + tpl.type.slice(1)}</span>
              </div>
              <div className="text-xs text-gray-500 truncate">{tpl.subject}</div>
              <div className="flex gap-2 mt-1">
                <button className="text-xs text-blue-600 hover:underline" onClick={() => handleEdit(tpl)}>Edit</button>
                <button className="text-xs text-red-600 hover:underline" onClick={() => handleDelete(tpl._id)}>Delete</button>
              </div>
            </li>
          ))}
          {templates.length === 0 && <li className="text-gray-400 text-sm">No templates</li>}
        </ul>
      )}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editTemplate ? "Edit Template" : "New Template"}</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Name template</label>
                <input
                  className="border rounded p-2 w-full"
                  placeholder="Name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Type</label>
                <select
                  className="border rounded p-2 w-full"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  required
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Subject</label>
                <input
                  className="border rounded p-2 w-full"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Body</label>
                <textarea
                  className="border rounded p-2 w-full min-h-[80px]"
                  placeholder="Body"
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 rounded border" onClick={() => { setShowForm(false); setEditTemplate(null); }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white shadow">{editTemplate ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
} 