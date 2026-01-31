import type { Metadata } from "next";
import { DM_Serif_Display, Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  variable: "--font-serif",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sava Trust — Officer Dashboard",
  description:
    "Monitor trust financial health and process beneficiary distribution requests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${dmSerifDisplay.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
