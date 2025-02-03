"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { navLinks } from "@/lib/constants";

const TopBar = () => {
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  // ✅ Esto asegura que `UserButton` solo se renderiza en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="sticky top-0 z-20 w-full flex justify-between items-center px-6 py-4 bg-gray-800 shadow-md lg:hidden">
      {/* LOGO */}
      <Link href="/">
        <Image src="/logo.svg" alt="logo" width={60} height={60} />
      </Link>

      {/* MENÚ HORIZONTAL (Desktop) */}
      <div className="hidden md:flex gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.url}
            className={`text-body-medium transition-all duration-300 ${
              pathname === link.url ? "text-blue-500 font-bold" : "text-gray-300 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* PERFIL & MENÚ MOBILE */}
      <div className="relative flex gap-4 items-center">
        <button
          className="block md:hidden focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            setDropdownMenu(!dropdownMenu);
          }}
        >
          {dropdownMenu ? <X className="w-7 h-7 text-white" /> : <Menu className="w-7 h-7 text-white" />}
        </button>

        {/* Menú desplegable Mobile */}
        {dropdownMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 right-0 w-52 bg-gray-800 text-white rounded-lg shadow-lg p-5 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.url}
                className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg transition-all"
                onClick={() => setDropdownMenu(false)}
              >
                {link.icon}
                <p>{link.label}</p>
              </Link>
            ))}
          </motion.div>
        )}

        {/* ✅ Renderizar `UserButton` solo en el cliente */}
        {isClient && <UserButton />}
      </div>
    </div>
  );
};

export default TopBar;
