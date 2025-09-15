"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { navLinks } from "@/lib/constants";
import GlobalNotifications from "@/components/ui/GlobalNotifications";

const TopBar = () => {
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    setUserDropdown(false);
    setDropdownMenu(false);
    logout();
  };

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

      {/* USER INFO & MENU */}
      <div className="relative flex gap-4 items-center">
        {/* Global Notifications */}
        <GlobalNotifications className="hidden md:block" />
        {/* User Dropdown (Desktop) */}
        {isClient && user && (
          <div className="hidden md:block relative">
            <button
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center gap-2 text-white bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-all duration-200"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">{user.firstName}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {userDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-30"
              >
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          className="block md:hidden focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            setDropdownMenu(!dropdownMenu);
          }}
        >
          {dropdownMenu ? <X className="w-7 h-7 text-white" /> : <Menu className="w-7 h-7 text-white" />}
        </button>

        {/* Mobile Dropdown */}
        {dropdownMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 right-0 w-52 bg-gray-800 text-white rounded-lg shadow-lg p-5 flex flex-col gap-4"
          >
            {/* User Info in Mobile */}
            {isClient && user && (
              <div className="border-b border-gray-600 pb-3 mb-3">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            )}

            {/* Notifications in Mobile */}
            <div className="border-b border-gray-600 pb-3 mb-3">
              <GlobalNotifications className="md:hidden" />
            </div>

            {/* Navigation Links */}
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

            {/* Logout in Mobile */}
            {isClient && user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg transition-all text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <p>Sign Out</p>
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
