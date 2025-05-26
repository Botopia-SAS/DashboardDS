"use client";

import ContactForm from "@/components/ui/ContactForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <Link href="/console">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Console
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex-1 text-center">Contact Center</h1>
      </div>
      <ContactForm />
    </div>
  );
} 