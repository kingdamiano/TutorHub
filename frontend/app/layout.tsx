import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { LampDesk } from 'lucide-react';
import Link from 'next/link';
import './globals.css';
import AuthStatus from './AuthStatus';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});

export const metadata: Metadata = {
  title: 'TutorHub',
  description: 'TutorHub learning platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} bg-background`}>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary/70 text-foreground">
                <LampDesk className="h-4 w-4" />
              </span>
              <span className="font-serif text-xl font-semibold">TutorHub</span>
            </Link>
            <AuthStatus />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
