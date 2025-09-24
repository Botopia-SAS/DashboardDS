"use client";

import { ColumnDef } from "@tanstack/react-table";
import Delete from "../custom ui/Delete";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, X } from "lucide-react";

// 1. Definir el tipo InstructorType
export type InstructorType = {
  _id: string;
  name: string;
  photo: string; // URL de la foto
  certifications?: string; // Certificaciones (opcional)
  experience?: string; // Experiencia (opcional)
  canTeachTicketClass?: boolean;
  canTeachDrivingTest?: boolean;
  canTeachDrivingLesson?: boolean;
};

// 2. Definir las columnas de la table
export const columns: ColumnDef<InstructorType>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/instructors/${row.original._id}`}
        className="flex items-center gap-2 font-semibold text-blue-500 hover:text-blue-700 transition-colors duration-200"
      >
        {row.original.name}
        <ArrowUpRight size={16} className="opacity-75" />
      </Link>
    ),
  },
  {
    accessorKey: "photo",
    header: "Photo",
    cell: ({ row }) => (
      <>
        {row.original.photo ? (
          <Image
            src={row.original.photo}
            alt={row.original.name}
            width={80}
            height={80}
            className="rounded-full object-cover border border-gray-300 shadow-md hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <p className="text-gray-500">No photo</p>
        )}
      </>
    ),
  },
  {
    accessorKey: "certifications",
    header: "Certifications",
    cell: ({ row }) => (
      <p className="font-medium text-gray-700">
        {row.original.certifications ? row.original.certifications : "N/A"}
      </p>
    ),
  },
  {
    accessorKey: "experience",
    header: "Experience",
    cell: ({ row }) => (
      <p className="font-medium text-gray-700">
        {row.original.experience ? row.original.experience : "N/A"}
      </p>
    ),
  },
  {
    accessorKey: "classTypes",
    header: "Class Types",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Ticket:</span>
          {row.original.canTeachTicketClass ? (
            <Check size={14} className="text-green-600" />
          ) : (
            <X size={14} className="text-red-600" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Test:</span>
          {row.original.canTeachDrivingTest ? (
            <Check size={14} className="text-green-600" />
          ) : (
            <X size={14} className="text-red-600" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Lesson:</span>
          {row.original.canTeachDrivingLesson ? (
            <Check size={14} className="text-green-600" />
          ) : (
            <X size={14} className="text-red-600" />
          )}
        </div>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Delete item="instructors" id={row.original._id} />
      </div>
    ),
  },
];
