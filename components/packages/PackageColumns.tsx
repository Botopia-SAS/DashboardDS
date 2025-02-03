"use client";

import { ColumnDef } from "@tanstack/react-table";
import Delete from "../custom ui/Delete";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

// ✅ Definir tipo para los Packages
export type PackageType = {
  _id: string;
  title: string;
  price: number;
  media: string[]; // URLs de imágenes/videos
};

// ✅ Definir las columnas para la tabla
export const columns: ColumnDef<PackageType>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        href={`/packages/${row.original._id}`}
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
      <p className="font-medium text-gray-700">${row.original.price.toFixed(2)}</p>
    ),
  },
  {
    accessorKey: "media",
    header: "Preview",
    cell: ({ row }) => {
      const media = row.original.media || []; // ✅ Asegurar que siempre sea un array
  
      return (
        <>
          {media.length > 0 ? (
            <Image
              src={media[0]}
              alt={row.original.title}
              width={100}
              height={100}
              className="rounded-lg object-cover border border-gray-300 shadow-md hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <p>No image</p>
          )}
        </>
      );
    },
  }
  ,
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Delete item="packages" id={row.original._id} />
      </div>
    ),
  },
];
