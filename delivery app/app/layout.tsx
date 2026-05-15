import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ToasterClient from "@/components/ui/ToasterClient";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Driver Dashboard",
  description: "Premium delivery driver dashboard optimized for Addis Ababa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh antialiased">
        {children}
        <ToasterClient />
      </body>
    </html>
  );
}

