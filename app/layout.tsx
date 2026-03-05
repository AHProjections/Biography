import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Biography App',
  description: 'Voice-first biography builder starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
