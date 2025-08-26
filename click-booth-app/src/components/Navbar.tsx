"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Camera,
  CreditCard,
  LogIn,
  UserPlus,
  Gem,
  Menu,
  X,
  Bell,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { FloatingDock } from "./ui/floating-dock";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigation = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="w-5 h-5 text-neutral-300 dark:text-neutral-200" />,
    },
    {
      name: "Booth",
      href: "/layout-selection",
      icon: (
        <Camera className="w-5 h-5 text-neutral-300 dark:text-neutral-200" />
      ),
    },
    {
      name: "Gallery",
      href: "/profile",
      icon: (
        <ImageIcon className="w-5 h-5 text-neutral-300 dark:text-neutral-200" />
      ),
    },
    {
      name: "Payment",
      href: "/payment",
      icon: (
        <CreditCard className="w-5 h-5 text-neutral-300 dark:text-neutral-200" />
      ),
    },
    {
      name: "Login",
      href: "/login",
      icon: (
        <LogIn className="w-5 h-5 text-neutral-300 dark:text-neutral-200" />
      ),
    },
    {
      name: "Register",
      href: "/register",
      icon: (
        <UserPlus className="w-5 h-5 text-neutral-300 dark:text-neutral-200" />
      ),
    },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* ...navbar kamu seperti sebelumnya (dipersingkat di sini)... */}

      {/* Tambahkan FloatingDock di bawah layar */}
      <FloatingDock
        items={navigation.map((i) => ({
          title: i.name,
          href: i.href,
          icon: i.icon,
        }))}
        desktopClassName="fixed top-6 left-1/2 -translate-x-1/2 z-40"
        mobileClassName="fixed top-6 right-6 z-40"
      />
    </>
  );
}
