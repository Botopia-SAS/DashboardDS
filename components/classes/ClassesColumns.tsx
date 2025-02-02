"use client";

import { ColumnDef } from "@tanstack/react-table";
import Delete from "../custom ui/Delete";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

// 1. Definir el tipo DrivingClassType
export type DrivingClassType = {
  _id: string;
  title: string;
  length: number; // Duración en horas
  price: number; // Precio en dólares
  image: string; // URL de la imagen
};

// 2. Definir las columnas de la tabla
export const columns: ColumnDef<DrivingClassType>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        href={`/classes/${row.original._id}`}
        className="flex items-center gap-2 font-semibold text-blue-500 hover:text-blue-700 transition-colors duration-200"
      >
        {row.original.title}
        <ArrowUpRight size={16} className="opacity-75" />
      </Link>
    ),
  },
  {
    accessorKey: "length",
    header: "Length (Hours)",
    cell: ({ row }) => (
      <p className="font-medium text-gray-700">{row.original.length} hrs</p>
    ),
  },
  {
    accessorKey: "price",
    header: "Price ($)",
    cell: ({ row }) => (
      <p className="font-medium text-gray-700">${(row.original.price ?? 0).toFixed(2)}</p>
    ),
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => (
      <>
        {row.original.image ? (
          <Image
            src={row.original.image}
            alt={row.original.title}
            width={100}
            height={100}
            className="rounded-lg object-cover border border-gray-300 shadow-md hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <p className="text-gray-500">No image</p>
        )}
      </>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Delete item="class" id={row.original._id} />
      </div>
    ),
  },
];
