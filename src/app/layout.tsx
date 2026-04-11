import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { WebGLFallback } from "@/components/ui/webgl-fallback";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"], // добавлена поддержка кириллицы
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
  colorScheme: 'dark', // принудительно тёмная тема
};

export const metadata: Metadata = {
  title: "Володька | Визуальная новелла",
  description: "Быт инженера IT, мистическая драма, романтика, киберпанк. Визуальная новелла со стихами Владимира Лебедева.",
  keywords: ["визуальная новелла", "поэзия", "драма", "киберпанк", "интерактивная история", "Владимир Лебедев", "игра"],
  authors: [{ name: "Владимир Лебедев", url: "https://volodka.vercel.app" }],
  creator: "Владимир Лебедев",
  publisher: "Владимир Лебедев",
  metadataBase: new URL("https://volodka.vercel.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Володька — Визуальная новелла",
    description: "Депрессивный поэт в постсоветском киберпанке. Стихи, выборы, 3D-исследование.",
    url: "https://volodka.vercel.app",
    siteName: "Володька",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Володька — визуальная новелла",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Володька — Визуальная новелла",
    description: "Депрессивный поэт в постсоветском киберпанке. Стихи, выборы, 3D-исследование.",
    creator: "@vovka_poet",
    images: ["/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json", // для PWA
  appleWebApp: {
    capable: true,
    title: "Володька",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Предзагрузка критических шрифтов */}
        <link
          rel="preload"
          href="/fonts/geist-cyrillic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Индикатор загрузки для медленных соединений */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.isWebGLSupported = function() {
                try {
                  var canvas = document.createElement('canvas');
                  return !!(window.WebGLRenderingContext && 
                    (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
                } catch(e) {
                  return false;
                }
              };
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <WebGLFallback>{children}</WebGLFallback>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
