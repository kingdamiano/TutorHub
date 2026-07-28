import type { Metadata } from 'next';
import { Inter, Fraunces, Noto_Sans } from 'next/font/google';
import { LampDesk } from 'lucide-react';
import Link from 'next/link';
import './globals.css';
import AuthStatus from './AuthStatus';
import { AuthModalProvider } from './AuthModal';
import Footer from '../components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});
const notoSans = Noto_Sans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-noto-sans',
});

export const metadata: Metadata = {
  title: 'Study Lamp',
  description: 'Study Lamp learning platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${notoSans.variable} bg-background`}>
      <body className="min-h-screen bg-background font-sans antialiased text-white">
        <div className="flex min-h-screen flex-col">
          <AuthModalProvider>
            <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-2.5 text-white whitespace-nowrap">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-secondary/70 text-white shadow-sm">
                  <LampDesk className="h-4 w-4" />
                </span>
                <span className="font-sans text-base font-semibold tracking-tight text-white sm:text-lg md:text-xl whitespace-nowrap">
                  Study Lamp
                </span>
              </Link>

              <AuthStatus />
            </div>
          </header>
            {children}
            <div className="mt-auto">
              <Footer />
            </div>
          </AuthModalProvider>
        </div>
      </body>
    </html>
  );
}
