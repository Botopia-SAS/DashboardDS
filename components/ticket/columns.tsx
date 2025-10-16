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
  licenseNumber?: string;
  instructorId?: string;
  instructorName?: string;
  type?: string; // Type of the class: 'date', 'bdi', or 'adi'
  reason?: string; // Combined reason field
  country_ticket?: string;
  course_country?: string;
  citation_number?: string;
  userAddress?: string;
  courseAddress?: string;
  courseTime?: string;
  address?: string;
  duration?: string; // Duration from ticket class (e.g., "2h")
  locationId?: string; // Location ID from ticket class
  // New fields for class information
  classTitle?: string; // Title of the class from drivingclasses
  classType?: string; // Type of class from drivingclasses (DATE, BDI, ADI)
  // Certificate-specific fields
  courseCompletionDate?: string;
  country_course?: string;
  license_number?: string;
  dateOfBirth?: string;
  sex?: string;
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
  {
    accessorKey: "citation_number",
    header: "Citation Number",
    cell: ({ row }) => {
      const citationNumber = row.getValue("citation_number") as string;
      return citationNumber || "-";
    },
  },
];
