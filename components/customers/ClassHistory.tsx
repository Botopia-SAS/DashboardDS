"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

type ClassTabType = "driving-lesson" | "driving-test";

interface ClassHistoryProps {
  customerId: string;
}

interface ChecklistItem {
  name: string;
  completed: boolean;
  rating?: number;
  comments?: string;
  tally?: number;
}

interface ChecklistNote {
  text: string;
  date: string;
}

interface SessionChecklistData {
  _id: string;
  checklistType: string;
  instructorName: string;
  items: ChecklistItem[];
  notes: ChecklistNote[];
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
  progress: number;
  averageRating: string;
}

const CHECKLIST_TYPES = {
  "driving-lesson": "Driving Skills Basics",
  "driving-test": "Driving Test Skills",
} as const;

const STATUS_STYLES = {
  completed: "bg-green-100 text-green-700 border border-green-300",
  in_progress: "bg-blue-100 text-blue-700 border border-blue-300",
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
} as const;

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatusLabel = (status: string): string => {
  return status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1);
};

const ClassHistory = ({ customerId }: ClassHistoryProps) => {
  const [activeTab, setActiveTab] = useState<ClassTabType>("driving-lesson");
  const [checklists, setChecklists] = useState<SessionChecklistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}/session-checklists`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setChecklists(data);
      } catch (err) {
        console.error("Error fetching checklists:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customerId]);

  const filteredData = useMemo(() => {
    const targetType = CHECKLIST_TYPES[activeTab];

    return checklists.filter((checklist) => {
      if (checklist.checklistType !== targetType) return false;

      if (dateFilter) {
        const d = new Date(checklist.createdAt);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (dateStr !== dateFilter) return false;
      }

      if (statusFilter && checklist.status !== statusFilter) return false;

      return true;
    });
  }, [checklists, activeTab, dateFilter, statusFilter]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const clearFilters = useCallback(() => {
    setDateFilter("");
    setStatusFilter("");
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6" aria-label="Assessment Type">
          {(Object.keys(CHECKLIST_TYPES) as ClassTabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab === "driving-lesson" ? "Driving Lesson" : "Driving Test"}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {activeTab === "driving-lesson" ? "Driving Lesson - Skills Assessment" : "Driving Test - Skills Assessment"}
        </h3>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by date"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {(dateFilter || statusFilter) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              aria-label="Clear filters"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        {filteredData.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">
              No {activeTab === "driving-lesson" ? "driving lessons" : "driving tests"} found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((checklist) => (
              <ChecklistCard
                key={checklist._id}
                checklist={checklist}
                isExpanded={expandedId === checklist._id}
                onToggle={toggleExpanded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ChecklistCardProps {
  checklist: SessionChecklistData;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

const ChecklistCard = ({ checklist, isExpanded, onToggle }: ChecklistCardProps) => {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-lg font-bold">{checklist.checklistType}</h4>
              <span className={cn("px-3 py-1 text-xs font-semibold rounded-full", STATUS_STYLES[checklist.status])}>
                {formatStatusLabel(checklist.status)}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 text-sm text-gray-600">
              <span>Instructor: {checklist.instructorName}</span>
              <span>{formatDate(checklist.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={() => onToggle(checklist._id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Hide" : "View"} details for ${checklist.checklistType}`}
          >
            {isExpanded ? "Hide" : "View"} Details
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar checklist={checklist} />

      {/* Expanded Details */}
      {isExpanded && <ChecklistDetails checklist={checklist} />}
    </div>
  );
};

const StatsBar = ({ checklist }: { checklist: SessionChecklistData }) => (
  <div className="bg-gray-50 p-4 border-b">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Progress</p>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${checklist.progress}%` }} />
            </div>
            <span className="text-sm font-bold">{checklist.progress}%</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl">★</div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Avg Rating</p>
          <p className="text-sm font-bold">{checklist.averageRating}/10</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">📋</div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Total Items</p>
          <p className="text-sm font-bold">{checklist.items.length} skills</p>
        </div>
      </div>
    </div>
  </div>
);

const ChecklistDetails = ({ checklist }: { checklist: SessionChecklistData }) => (
  <div className="p-6 bg-white">
    {/* Notes */}
    <div className="mb-6">
      <h4 className="font-bold text-base mb-3">📝 Instructor Notes</h4>
      {checklist.notes?.length > 0 ? (
        <div className="space-y-3">
          {checklist.notes.map((note, i) => (
            <div key={`note-${checklist._id}-${i}-${note.date}`} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-gray-800">{note.text}</p>
              <p className="text-xs text-gray-500 mt-2">{formatDateTime(note.date)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">No instructor notes</p>
        </div>
      )}
    </div>

    {/* Items */}
    <div>
      <h4 className="font-bold text-base mb-3">✅ Skill Assessment</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checklist.items.map((item, i) => (
          <SkillCard key={`item-${checklist._id}-${i}-${item.name}`} item={item} checklistId={checklist._id} index={i} />
        ))}
      </div>
    </div>
  </div>
);

interface SkillCardProps {
  item: ChecklistItem;
  checklistId: string;
  index: number;
}

const SkillCard = ({ item, checklistId, index }: SkillCardProps) => (
  <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-2">
      <h5 className="font-semibold text-sm flex-1 pr-2">{item.name}</h5>
      {item.completed && (
        <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs" aria-label="Completed">
          ✓
        </span>
      )}
    </div>
    {item.rating !== undefined && (
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500">Rating</span>
          <span className="text-sm font-bold">{item.rating}/10</span>
        </div>
        <div className="flex gap-0.5" aria-label={`${item.rating} out of 10 stars`}>
          {Array.from({ length: 10 }, (_, s) => (
            <span key={`star-${checklistId}-${index}-${s}`} className={s < (item.rating ?? 0) ? "text-yellow-400" : "text-gray-300"} aria-hidden="true">
              ★
            </span>
          ))}
        </div>
      </div>
    )}
    {item.tally !== undefined && item.tally > 0 && (
      <div className="mb-2 bg-purple-50 px-2 py-1 rounded text-xs text-purple-700">Tally: {item.tally}</div>
    )}
    {item.comments && (
      <div className="mt-2 pt-2 border-t text-xs text-gray-600 italic">&quot;{item.comments}&quot;</div>
    )}
  </div>
);

export default ClassHistory;
