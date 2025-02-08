"use client";

import { ColumnDef } from "@tanstack/react-table";
import Delete from "../custom ui/Delete";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";


// 1. Definir el tipo CollectionType
export type CollectionType = {
  _id: string;
  title: string;
  description: string;
  price: number; // Añadir precio
  image: string; // URL de la imagen
};

// 2. Usar el tipo en la definición de las columnas
export const columns: ColumnDef<CollectionType>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        href={`/collections/${row.original._id}`}
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
            width={200} // Ajusta el tamaño aquí
            height={200}
            className="rounded-lg object-cover border border-gray-300 shadow-md hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <p>No image</p>
        )}
      </>
    ),
  },  

  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Delete item="collections" id={row.original._id} />
      </div>
    ),
  },
];
