import { cn } from "@/lib/utils"; // Función opcional para manejar clases condicionales
import React, { useState } from "react";

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
}

export function Tabs({ children, defaultValue }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className="w-full">
      {children &&
        React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(
                child as React.ReactElement<{
                  activeTab: string;
                  setActiveTab: (tab: string) => void;
                }>,
                {
                  activeTab,
                  setActiveTab,
                }
              )
            : child
        )}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return <div className={cn("flex border-b", className)}>{children}</div>;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export function TabsTrigger({
  value,
  children,
  activeTab,
  setActiveTab,
}: TabsTriggerProps) {
  return (
    <button
      className={cn(
        "p-2 md:p-4 text-sm md:text-base font-medium cursor-pointer",
        activeTab === value
          ? "border-b-2 border-blue-500 text-blue-600"
          : "text-gray-600 hover:text-blue-500"
      )}
      onClick={() => setActiveTab && setActiveTab(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  activeTab?: string;
}

export function TabsContent({ value, children, activeTab }: TabsContentProps) {
  return activeTab === value ? <div className="p-4">{children}</div> : null;
}
