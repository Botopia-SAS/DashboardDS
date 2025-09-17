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
    <div className="h-screen overflow-hidden left-0 top-0 sticky flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl shadow-black max-lg:hidden w-64">
      {/* LOGO */}
      <div className="flex justify-center p-6 h-xs:p-1 h-sm:p-2 h-md:p-4 flex-shrink-0">
        <Image 
          src="/logo.svg" 
          alt="logo" 
          width={78} 
          height={78} 
          className="max-w-full h-auto min-h-0 h-xs:w-8 h-xs:h-8 h-sm:w-10 h-sm:h-10 h-md:w-16 h-md:h-16" 
        />
      </div>

      {/* MENÚ */}
      <nav className="flex flex-col gap-3 h-xs:gap-0 h-sm:gap-0.5 h-md:gap-2 px-6 h-xs:px-1 h-sm:px-2 h-md:px-4 flex-1 overflow-y-auto scrollbar-hidden min-h-0">
        {navLinks.map((link) => (
          <Link
            href={link.url}
            key={link.label}
            className={`flex items-center gap-4 h-xs:gap-1 h-sm:gap-1.5 h-md:gap-3 px-5 h-xs:px-1.5 h-sm:px-2 h-md:px-4 py-3 h-xs:py-1 h-sm:py-1.5 h-md:py-2.5 rounded-lg transition-all duration-300 w-full
              ${
                pathname === link.url 
                  ? "bg-blue-500 text-white shadow-lg scale-105 h-xs:scale-100 h-sm:scale-100 h-md:scale-102"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md hover:scale-105 h-xs:hover:scale-100 h-sm:hover:scale-100 h-md:hover:scale-102"
              }`}
          >
            <span className="flex-shrink-0 w-5 h-5 h-xs:w-3 h-xs:h-3 h-sm:w-3.5 h-sm:h-3.5 h-md:w-4.5 h-md:h-4.5 flex items-center justify-center">
              {link.icon}
            </span>
            <p className="text-[0.9rem] h-xs:text-[0.65rem] h-sm:text-xs h-md:text-sm font-medium h-xs:leading-tight">{link.label}</p>
          </Link>
        ))}
      </nav>

      {/* USER INFO & LOGOUT */}
      <div className="mt-auto space-y-2 h-xs:space-y-0.5 h-sm:space-y-1 h-md:space-y-1.5 mb-4 h-xs:mb-1 h-sm:mb-2 h-md:mb-3 px-6 h-xs:px-1 h-sm:px-2 h-md:px-4">
        <div className="flex flex-col gap-2 h-xs:gap-0.5 h-sm:gap-1 h-md:gap-1.5">
          <div className="flex gap-4 h-xs:gap-1 h-sm:gap-1.5 h-md:gap-3 items-center px-5 h-xs:px-1.5 h-sm:px-2 h-md:px-4 py-3 h-xs:py-1 h-sm:py-1.5 h-md:py-2.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 hover:scale-105 h-xs:hover:scale-100 h-sm:hover:scale-100 h-md:hover:scale-102 transition-all w-full cursor-pointer">
            <p className="text-[0.9rem] h-xs:text-[0.65rem] h-sm:text-xs h-md:text-sm font-medium h-xs:leading-tight">Edit Profile</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 h-xs:gap-1 h-sm:gap-1.5 h-md:gap-3 px-5 h-xs:px-1.5 h-sm:px-2 h-md:px-4 py-3 h-xs:py-1 h-sm:py-1.5 h-md:py-2.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 hover:scale-105 h-xs:hover:scale-100 h-sm:hover:scale-100 h-md:hover:scale-102 transition-all w-full"
          >
            <LogOut className="w-5 h-5 h-xs:w-3 h-xs:h-3 h-sm:w-3.5 h-sm:h-3.5 h-md:w-4.5 h-md:h-4.5 flex-shrink-0" />
            <p className="text-[0.9rem] h-xs:text-[0.65rem] h-sm:text-xs h-md:text-sm font-medium h-xs:leading-tight">Sign Out</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftSideBar;
