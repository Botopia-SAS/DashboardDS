import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface Props {
  href: string;
  title: string;
  description: string;
  onClick?: (e: React.MouseEvent) => void;
}
export default function Navigation({
  href,
  title,
  description,
  onClick,
}: Props) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between bg-white hover:bg-gray-100 border border-gray-200 px-5 py-4 rounded-lg transition-colors shadow-sm"
    >
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowRight className="size-6 text-gray-500" />
    </Link>
  );
}
