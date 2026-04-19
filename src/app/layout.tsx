import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { GameStoreHydration } from './GameStoreHydration';
import { AppPerfWarmup } from './AppPerfWarmup';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'ВОЛОДЬКА — RPG о жизни, стихах и одиночестве',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
  },
  description:
    'Интерактивная история Владимира Лебедева — 12 лет в техподдержке, 10 лет любви, 8 лет одиночества. Реальные стихи. Настоящая боль.',
  keywords: [
    'RPG',
    'Visual Novel',
    'поэзия',
    'одиночество',
    'ВОЛОДЬКА',
    'интерактивная история',
    'Владимир Лебедев',
  ],
  authors: [{ name: 'Владимир Лебедев' }],
};

/** Мобильные браузеры: вписать в экран с вырезами, без лишнего масштабирования страницы. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#030308',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <GameStoreHydration />
        <AppPerfWarmup />
        {children}
      </body>
    </html>
  );
}
