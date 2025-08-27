"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Navbar as ResizableNavbar,
  NavBody,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from "@/components/ui/resizable-navbar";
import {
  Camera,
  Gem,
  Home,
  ImageIcon,
  LogIn,
  User,
  UserPlus,
} from "lucide-react";
import { getUserFromCookiesClient } from "@/helpers/getUserFromCookiesClient";

interface UserData {
  id: string;
  email: string;
  role: string;
  tokens?: number;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [userTokens, setUserTokens] = useState(0);

  // Load user data
  useEffect(() => {
    const userData = getUserFromCookiesClient();
    if (userData) {
      setUser(userData);
      // Fetch latest token count
      fetchUserTokens();
    }
  }, []);

  const fetchUserTokens = async () => {
    try {
      const response = await fetch("/api/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUserTokens(data.tokens || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user tokens:", error);
    }
  };

  // Refresh tokens when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchUserTokens();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const navItems = [
    { name: "Home", link: "/", icon: <Home className="w-4 h-4 mr-1" /> },
    {
      name: "Booth",
      link: "/layout-selection",
      icon: <Camera className="w-4 h-4 mr-1" />,
    },
    {
      name: "Profile",
      link: "/profile",
      icon: <ImageIcon className="w-4 h-4 mr-1" />,
    },
    {
      name: "Payment",
      link: "/payment",
      icon: <Gem className="w-4 h-4 mr-1" />,
    },
  ];

  return (
    <div className="fixed top-0 inset-x-0 z-50 w-full">
      <ResizableNavbar className="top-0">
        {/* Desktop Navigation */}
        <NavBody>
          {/* Logo */}
          <Link
            href="/"
            className="relative z-20 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <Image
                src="/clickBooth.png"
                alt="ClickBooth Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="text-xs text-slate-800 px-2 py-1 font-medium">
              <span className="font-bold text-slate-800">
                Click<span className="text-red-500">Booth</span>
              </span>
            </div>
            {/* <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              PROFESSIONAL STUDIO
            </span> */}
          </Link>

          {/* Navigation Items */}
          <div className="hidden lg:flex items-center justify-center space-x-1">
            {navItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.link}
                className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side - User Info & Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Token Display */}
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
                  <Gem className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-sm">{userTokens}</span>
                  <span className="text-xs">tokens</span>
                </div>

                {/* User Menu */}
                {/* <div className="flex items-center space-x-2">
                  <NavbarButton
                    href="/profile"
                    variant="secondary"
                    className="text-sm flex items-center"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Profile
                  </NavbarButton>
                </div> */}
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <NavbarButton
                  href="/login"
                  variant="secondary"
                  className="text-sm flex items-center"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Login
                </NavbarButton>

                <NavbarButton
                  href="/register"
                  variant="primary"
                  className="text-sm flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Register
                </NavbarButton>
              </div>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            {/* Mobile Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <Image
                  src="/clickBooth.png"
                  alt="ClickBooth Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-slate-800">
                Click<span className="text-red-500">Booth</span>
              </span>
            </Link>

            {/* Mobile User Info */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-slate-700 px-2 py-1 rounded-full border border-slate-200">
                  <Gem className="w-3 h-3 text-red-500" />
                  <span className="font-bold text-xs">{userTokens}</span>
                </div>
              )}
              <MobileNavToggle
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
              />
            </div>
          </MobileNavHeader>

          {/* Mobile Menu */}
          <MobileNavMenu isOpen={isOpen}>
            {/* Mobile Navigation Links */}
            <div className="flex flex-col space-y-4 w-full">
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.link}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center text-sm font-medium px-4 py-2 rounded-lg transition-colors text-slate-600 hover:bg-slate-100"
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile User Actions */}
            <div className="border-t border-slate-200 pt-4 w-full">
              {user ? (
                <div className="flex flex-col space-y-3">
                  <NavbarButton
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    variant="secondary"
                    className="w-full text-sm flex items-center justify-center"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Profile
                  </NavbarButton>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <NavbarButton
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    variant="secondary"
                    className="w-full text-sm flex items-center justify-center"
                  >
                    <LogIn className="w-4 h-4 mr-1" />
                    Login
                  </NavbarButton>
                  <NavbarButton
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    variant="primary"
                    className="w-full text-sm flex items-center justify-center"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Register
                  </NavbarButton>
                </div>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </ResizableNavbar>
    </div>
  );
}
