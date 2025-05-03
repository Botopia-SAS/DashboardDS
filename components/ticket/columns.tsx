"use client";

import { ColumnDef } from "@tanstack/react-table";

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  certn: number;
  midl: string;
  payedAmount: number;
  birthDate: string;
  courseDate: string;
  paymentMethod?: string;
}

export const columns: ColumnDef<Student>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
  },
  {
    accessorKey: "first_name",
    header: "First Name",
  },
  {
    accessorKey: "midl",
    header: "Middle Name",
  },
  {
    accessorKey: "payedAmount",
    header: "Payed Amount",
  },
  {
    accessorKey: "certn",
    header: "Certificate Number",
  },
];
