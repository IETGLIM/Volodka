import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0f",
};

export const metadata: Metadata = {
  title: "ВОЛОДЬКА — сказка между сменами",
  description:
    "Интерактивная память, киберпанк-сказка об уставшем инженере Володьке. 3D-исследование, стихи, квесты и выборы, которые меняют мир.",
  keywords: [
    "Volodka",
    "RPG",
    "киберпанк",
    "3D",
    "интерактивная история",
    "React Three Fiber",
  ],
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] text-foreground overflow-hidden`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
