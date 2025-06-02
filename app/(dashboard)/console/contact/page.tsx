"use client";

import ContactForm from "@/components/ui/ContactForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Layers, CalendarClock } from "lucide-react";
import TemplatesPanel from '@/components/ui/TemplatesPanel';
import { useEffect, useState } from "react";

export default function ContactPage() {
  const [sendBirthdayEmails, setSendBirthdayEmails] = useState(true);
  const [sendClassReminders, setSendClassReminders] = useState(true);

  // Consultar settings al cargar
  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSendBirthdayEmails(data.settings.sendBirthdayEmails);
          setSendClassReminders(data.settings.sendClassReminders);
        }
      });
  }, []);

  // Función para actualizar settings
  const updateSettings = (key: string, value: boolean) => {
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value })
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center py-8">
      <div className="w-full max-w-[1600px]">
        <div className="mb-6 flex items-center gap-2">
          <Link href="/console">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Console
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-center flex-1 text-blue-800 tracking-tight">Contact Center</h1>
        </div>
        {/* Checkboxes de activación arriba de los paneles */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center mb-8 p-4 bg-white rounded-xl border border-blue-200 shadow-md items-center">
          <label className="flex items-center gap-2 text-blue-800 font-semibold">
            <input type="checkbox" checked={sendBirthdayEmails} onChange={e => { setSendBirthdayEmails(e.target.checked); updateSettings("sendBirthdayEmails", e.target.checked); }} />
            Enable Birthday Emails
          </label>
          <label className="flex items-center gap-2 text-blue-800 font-semibold">
            <input type="checkbox" checked={sendClassReminders} onChange={e => { setSendClassReminders(e.target.checked); updateSettings("sendClassReminders", e.target.checked); }} />
            Enable Class Reminders
          </label>
        </div>
        <div className="flex flex-col md:flex-row w-full justify-center gap-10 mb-12">
          {/* Formulario principal */}
          <div className="w-full md:w-[48%] md:max-w-3xl flex flex-col">
            <div className="w-full h-full bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-8 border border-blue-100 md:justify-stretch md:flex-1 md:min-h-[600px]">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="text-blue-500" size={24} />
                <span className="text-2xl font-semibold text-blue-700">Send Email</span>
              </div>
              <div className="w-full flex flex-col gap-6 flex-1">
                <ContactForm />
              </div>
            </div>
          </div>
          {/* Panel templates */}
          <div className="w-full md:w-[48%] md:max-w-3xl flex flex-col">
            <div className="w-full h-full bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-8 border border-green-100 md:justify-stretch md:flex-1 md:min-h-[600px]">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="text-green-500" size={22} />
                <span className="text-xl font-semibold text-green-700">Templates</span>
              </div>
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: 800 }}>
                <TemplatesPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 