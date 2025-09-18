"use client";

import GlobalNotifications from "@/components/ui/GlobalNotifications";

interface NotificationBarProps {
  position?: "top-right" | "top-left";
  variant?: "dark" | "light";
}

export default function NotificationBar({ position = "top-right", variant = "dark" }: NotificationBarProps) {
  const positionClasses = position === "top-right" ? "top-6 right-6" : "top-6 left-6";
  const bgColor = variant === "dark" ? "bg-gray-800" : "bg-white border border-gray-200";
  const iconColor = variant === "dark" ? "text-white" : "text-gray-600";
  
  return (
    <div className={`fixed ${positionClasses} z-50 p-2 rounded-lg shadow-lg ${bgColor}`}>
      <GlobalNotifications iconColor={iconColor} />
    </div>
  );
}