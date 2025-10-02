"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { User } from "../types";

interface UserSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: User[];
  isSearching: boolean;
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  onClearUser: () => void;
}

export function UserSearch({
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  selectedUser,
  onUserSelect,
  onClearUser,
}: UserSearchProps) {
  return (
    <div className="space-y-2 pb-4 border-b border-gray-300">
      <Label htmlFor="userSearch">Search User</Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id="userSearch"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-10"
        />
        {selectedUser && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1.5"
            onClick={onClearUser}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white">
          {searchResults.map((user) => (
            <button
              key={user._id}
              onClick={() => onUserSelect(user)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
            >
              <div className="font-medium">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </button>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="font-medium text-blue-900">
            {selectedUser.firstName} {selectedUser.lastName}
          </div>
          <div className="text-sm text-blue-700">{selectedUser.email}</div>
        </div>
      )}

      {isSearching && (
        <div className="text-sm text-gray-500">Searching...</div>
      )}
    </div>
  );
}
