"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/custom ui/Loader";

export default function TicketRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default classtype (date)
    router.replace("/ticket/date");
  }, [router]);

  return <Loader />;
}