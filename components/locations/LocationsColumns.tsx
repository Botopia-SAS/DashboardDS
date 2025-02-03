import { ColumnDef } from "@tanstack/react-table";
import Delete from "../custom ui/Delete";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

// 1. Definir el tipo LocationType
export type LocationType = {
  _id: string;
  title: string;
  zone: string;
  locationImage?: string;
  instructors: {
    name: string;
  }[];
};

// 2. Usar el tipo en la definición de las columnas
export const columns: ColumnDef<LocationType>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        href={`/locations/${row.original._id}`}
        className="flex items-center gap-2 font-semibold text-blue-500 hover:text-blue-700 transition-colors duration-200"
      >
        {row.original.title}
        <ArrowUpRight size={16} className="opacity-75" />
      </Link>
    ),
  },  
  {
    accessorKey: "zone",
    header: "Zone",
    cell: ({ row }) => (
      <p className="font-medium text-gray-700">{row.original.zone}</p>
    ),
  },
  {
    accessorKey: "locationImage",
    header: "Location Image",
    cell: ({ row }) => (
      row.original.locationImage ? (
        <Image
          src={row.original.locationImage}
          alt={row.original.title}
          width={100}
          height={100}
          className="rounded-lg object-cover border border-gray-300 shadow-md hover:scale-105 transition-transform duration-200"
        />
      ) : (
        <p>No image</p>
      )
    ),
  },
  {
    accessorKey: "instructors",
    header: "Instructors",
    cell: ({ row }) => (
      <div className="space-y-2">
        {row.original.instructors.map((instructor, index) => (
          <p key={index} className="font-medium text-gray-700">{instructor.name}</p>
        ))}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Delete item="location" id={row.original._id} />
      </div>
    ),
  },
];
