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
    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/customers")}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </button>
      </div>
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CustomerTabs;
export type { TabType };
