"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ToasterProvider } from "@/lib/ToasterProvider";
import { OverlayCleanup } from "./OverlayCleanup";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToasterProvider />
      <OverlayCleanup />
      {children}
    </AuthProvider>
  );
} 