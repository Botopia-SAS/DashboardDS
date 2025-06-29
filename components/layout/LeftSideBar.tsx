"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navLinks } from "@/lib/constants";

const LeftSideBar = () => {
  const pathname = usePathname();

  return (
    <div className="h-screen overflow-auto left-0 top-0 sticky p-6 flex flex-col gap-10 bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl shadow-black max-lg:hidden w-64">
      {/* LOGO */}
      <div className="flex justify-center">
        <Image src="/logo.svg" alt="logo" width={80} height={80} />
      </div>

      {/* MENÚ */}
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => (
          <Link
            href={link.url}
            key={link.label}
            className={`flex items-center gap-4 px-5 py-3 rounded-lg transition-all duration-300 w-full
              ${
                pathname === link.url 
                  ? "bg-blue-500 text-white shadow-lg scale-105"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md hover:scale-105"
              }`}
          >
            {link.icon}
            <p className="text-lg font-medium">{link.label}</p>
          </Link>
        ))}
      </nav>

      {/* PERFIL */}
      <div className="mt-auto flex gap-4 items-center px-5 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 hover:scale-105 transition-all w-full">
        <p className="text-lg font-medium">Edit Profile</p>
      </div>
    </div>
  );
};

export default LeftSideBar;
