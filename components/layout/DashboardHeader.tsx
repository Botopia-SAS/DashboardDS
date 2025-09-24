"use client";

import GlobalNotifications from "@/components/ui/GlobalNotifications";

interface DashboardHeaderProps {
  title: string;
  children?: React.ReactNode;
  variant?: "dark" | "light"; // dark para páginas sin header, light para páginas con header
}

export default function DashboardHeader({ title, children, variant = "dark" }: DashboardHeaderProps) {
  const bgColor = variant === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800 border border-gray-200";
  const iconColor = variant === "dark" ? "text-white" : "text-gray-600";
  
  return (
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center px-3 sm:px-4 py-3 rounded-lg shadow-md mb-4 gap-3 sm:gap-4 ${bgColor}`}>
      <h1 className="text-lg sm:text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        {children}
        <GlobalNotifications iconColor={iconColor} />
      </div>
    </div>
  );
}