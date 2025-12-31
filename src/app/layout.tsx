
import type {Metadata} from 'next';
import { Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from '@/components/Providers';
import { AnimatedGlobe } from '@/components/AnimatedGlobe';

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export const metadata: Metadata = {
  title: 'TREINE',
  description: 'track your push and pull day workouts.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${robotoMono.variable} dark`}>
      <head />
      <body className="font-body antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <AnimatedGlobe />
      </body>
    </html>
  );
}
