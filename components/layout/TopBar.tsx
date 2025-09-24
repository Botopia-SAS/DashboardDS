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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownMenu && !target.closest('.mobile-nav-container')) {
        setDropdownMenu(false);
      }
      if (userDropdown && !target.closest('.user-dropdown-container')) {
        setUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownMenu, userDropdown]);

  const handleLogout = () => {
    setUserDropdown(false);
    setDropdownMenu(false);
    logout();
  };

  return (
    <div className="topbar-mobile w-full flex justify-between items-center px-4 py-3 bg-gray-800 shadow-md lg:hidden flex-shrink-0">
      {/* LOGO */}
      <Link href="/" className="flex-shrink-0">
        <Image 
          src="/logo.svg" 
          alt="logo" 
          width={50} 
          height={50} 
          className="w-12 h-12 sm:w-14 sm:h-14"
        />
      </Link>

      {/* MENÚ HORIZONTAL (Medium screens) */}
      <div className="hidden md:flex gap-2 lg:gap-4 flex-wrap">
        {navLinks.slice(0, 4).map((link) => (
          <Link
            key={link.label}
            href={link.url}
            className={`text-xs sm:text-sm transition-all duration-300 px-2 py-1 rounded ${
              pathname === link.url ? "text-blue-400 bg-blue-900/30 font-medium" : "text-gray-300 hover:text-white hover:bg-gray-700"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* USER INFO & MENU */}
      <div className="relative flex gap-2 sm:gap-3 items-center flex-shrink-0 mobile-nav-container">
        {/* Global Notifications */}
        <GlobalNotifications className="hidden md:block" iconColor="text-white" />
        
        {/* User Dropdown (Medium screens and up) */}
        {isClient && user && (
          <div className="hidden md:block relative user-dropdown-container">
            <button
              onClick={() => setUserDropdown(!userDropdown)}
              className="flex items-center gap-1 sm:gap-2 text-white bg-gray-700 hover:bg-gray-600 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm"
            >
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{user.firstName}</span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            {userDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 right-0 w-44 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-40"
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
          className="block md:hidden focus:outline-none p-1"
          onClick={(e) => {
            e.stopPropagation();
            setDropdownMenu(!dropdownMenu);
          }}
        >
          {dropdownMenu ? 
            <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" /> : 
            <Menu className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          }
        </button>

        {/* Mobile Dropdown Overlay and Menu */}
        {dropdownMenu && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setDropdownMenu(false)}
            />
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-4 right-4 sm:left-8 sm:right-8 md:absolute md:top-12 md:right-0 md:left-auto md:w-80 w-auto bg-gray-800 text-white rounded-lg shadow-xl p-4 flex flex-col gap-3 z-50 max-h-[calc(100vh-100px)] overflow-y-auto"
            >
            {/* User Info in Mobile */}
            {isClient && user && (
              <div className="border-b border-gray-600 pb-3">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            )}

            {/* Notifications in Mobile */}
            <div className="border-b border-gray-600 pb-3">
              <GlobalNotifications className="md:hidden w-full" iconColor="text-white" />
            </div>

            {/* Navigation Links - Grid layout for better mobile experience */}
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.url}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all text-sm ${
                    pathname === link.url 
                      ? "bg-blue-600 text-white" 
                      : "hover:bg-gray-700 text-gray-200"
                  }`}
                  onClick={() => setDropdownMenu(false)}
                >
                  <span className="w-4 h-4 flex-shrink-0">{link.icon}</span>
                  <span className="text-xs leading-tight">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Logout in Mobile */}
            {isClient && user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 hover:bg-red-600 rounded-lg transition-all text-red-400 hover:text-white border-t border-gray-600 pt-3 mt-2"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Sign Out</span>
              </button>
            )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default TopBar;
