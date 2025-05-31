"use client";

import { ColumnDef } from "@tanstack/react-table";
import Delete from "../custom ui/Delete";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

// 1. Definir el tipo OnlineCourseType
export type OnlineCourseType = {
  _id: string;
  title: string;
  price: number;
  image: string; // ✅ Agregar la imagen
};

// 2. Definir las columnas de la table
export const columns: ColumnDef<OnlineCourseType>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        href={`/online-courses/${row.original._id}`}
        className="flex items-center gap-2 font-semibold text-blue-500 hover:text-blue-700 transition-colors duration-200"
      >
        {row.original.title}
        <ArrowUpRight size={16} className="opacity-75" />
      </Link>
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
    cell: ({ row }) => {
      console.log("🛠 Online Course ID:", row.original._id); // 👀 Verifica el ID en la consola
      return (
        <div className="flex justify-center">
          <Delete item="online-courses" id={row.original._id} />
        </div>
      );
    },
  },  
];
