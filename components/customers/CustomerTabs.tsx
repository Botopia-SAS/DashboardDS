"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type TabType = "update" | "classes" | "certificates";

interface CustomerTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const CustomerTabs = ({ activeTab, onTabChange }: CustomerTabsProps) => {
  const router = useRouter();
  const tabs = [
    { id: "update" as TabType, label: "Update User" },
    { id: "classes" as TabType, label: "Class History" },
    { id: "certificates" as TabType, label: "Certificate History" },
  ];

  return (
    <div className="mb-6">
      {/* Header con tabs en la esquina superior derecha */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-3 sm:px-4 py-3 rounded-lg shadow-md gap-3 sm:gap-4 bg-gray-800 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/customers")}
            className="flex items-center gap-2 text-sm text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </button>
        </div>
        
        {/* Tabs Navigation en la esquina superior derecha */}
        <nav className="flex space-x-4 sm:space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-400 text-blue-300"
                  : "border-transparent text-gray-300 hover:text-white hover:border-gray-400"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default CustomerTabs;
export type { TabType };
