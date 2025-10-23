"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface SimpleDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKeys: string[];
  itemsPerPage?: number;
}

export function SimpleDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKeys,
  itemsPerPage = 10,
}: SimpleDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Filter data
  const filtered = search
    ? data.filter((item) =>
        searchKeys.some((key) => {
          const val = item[key];
          return val && String(val).toLowerCase().includes(search.toLowerCase());
        })
      )
    : data;

  // Paginate
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = filtered.slice(start, end);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="py-5">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or license number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="h-10 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.length > 0 ? (
              paginated.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-900">
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
