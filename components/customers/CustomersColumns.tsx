"use client";

import { ColumnDef } from "@tanstack/react-table";
import Delete from "../custom ui/Delete";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export type CustomerClassType = {
  id: string;
  email: string;
  role: string;
  name: string;
  licenseNumber?: string;
  createdAt: string;
};

export const customersColumns: ColumnDef<CustomerClassType>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.id}`}
        className="flex items-center gap-2 font-semibold text-blue-500 hover:text-blue-700 transition-colors duration-200"
      >
        {row.original.name}
        <ArrowUpRight size={16} className="opacity-75" />
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <p className="font-medium text-gray-700">{row.original.email}</p>
    ),
  },
  {
    accessorKey: "licenseNumber",
    header: "License Number",
    cell: ({ row }) => (
      <p className="font-medium text-gray-700">
        {row.original.licenseNumber || "Not available"}
      </p>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Registration Date",
    cell: ({ row }) => {
      // Format date in US English format or show "Not available"
      const date = row.original.createdAt
        ? new Date(row.original.createdAt)
        : null;
      return (
        <p className="font-medium text-gray-700">
          {date ? format(date, "MMM d, yyyy h:mm a") : "Not available"}
        </p>
      );
    },
  },
  {
    accessorKey: "id",
    header: "Actions",
    cell: ({ row }) => <Delete item="customers" id={row.original.id} />,
  },
];
