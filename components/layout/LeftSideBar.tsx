"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

import { navLinks } from "@/lib/constants";

const LeftSideBar = () => {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen overflow-y-auto scrollbar-hidden left-0 top-0 sticky p-6 flex flex-col gap-10 bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl shadow-black max-lg:hidden w-64">
      {/* LOGO */}
      <div className="flex justify-center">
        <Image src="/logo.svg" alt="logo" width={78} height={78} />
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
            <p className="text-[0.9rem] font-medium">{link.label}</p>
          </Link>
        ))}
      </nav>

      {/* USER INFO & LOGOUT */}
      <div className="mt-auto space-y-2 mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-4 items-center px-5 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 hover:scale-105 transition-all w-full cursor-pointer">
            <p className="text-[0.9rem] font-medium">Edit Profile</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-3 rounded-lg bg-blue-900 text-white hover:bg-blue-800 hover:scale-105 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <p className="text-[0.9rem] font-medium">Sign Out</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftSideBar;
