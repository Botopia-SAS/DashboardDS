"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Plus, Edit, Trash2 } from "lucide-react";

type PendingChangesSummary = {
  total: number;
  creates: number;
  updates: number;
  deletes: number;
  ticketClasses: number;
  drivingTests: number;
};

interface PendingChangesIndicatorProps {
  pendingChanges: PendingChangesSummary;
  hasChanges: boolean;
  savingChanges: boolean;
}

export function PendingChangesIndicator({
  pendingChanges,
  hasChanges,
  savingChanges
}: PendingChangesIndicatorProps) {
  if (!hasChanges && pendingChanges.total === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        No pending changes
      </div>
    );
  }

  if (savingChanges) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <div className="animate-spin w-4 h-4">
          <Clock className="w-4 h-4" />
        </div>
        Saving changes...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Indicador principal */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {pendingChanges.total} change{pendingChanges.total !== 1 ? 's' : ''} pending
        </span>
      </div>

      {/* Desglose de cambios */}
      <div className="flex items-center gap-2">
        {pendingChanges.creates > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <Plus className="w-3 h-3" />
            {pendingChanges.creates} new
          </Badge>
        )}
        
        {pendingChanges.updates > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
            <Edit className="w-3 h-3" />
            {pendingChanges.updates} edited
          </Badge>
        )}
        
        {pendingChanges.deletes > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
            <Trash2 className="w-3 h-3" />
            {pendingChanges.deletes} deleted
          </Badge>
        )}
      </div>

      {/* Información adicional sobre tipos */}
      {(pendingChanges.ticketClasses > 0 || pendingChanges.drivingTests > 0) && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {pendingChanges.ticketClasses > 0 && (
            <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded">
              {pendingChanges.ticketClasses} classes
            </span>
          )}
          {pendingChanges.drivingTests > 0 && (
            <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded">
              {pendingChanges.drivingTests} tests
            </span>
          )}
        </div>
      )}
    </div>
  );
} 