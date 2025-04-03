"use client";

import { ColumnDef } from "@tanstack/react-table";
import Delete from "../custom ui/Delete";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export type CustomerClassType = {
  id: string;
  email: string;
  role: string;
  name: string;
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
    accessorKey: "id",
    header: "Actions",
    cell: ({ row }) => <Delete item="customers" id={row.original.id} />,
  },
];
