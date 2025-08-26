import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ClickBooth Studio - Professional Photo Booth Experience",
  description:
    "Professional photo booth with AI-powered filters, instant WhatsApp sharing, and premium quality results. Get started today!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-amber-50">
        <Navbar />
        <main className="pt-24 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
