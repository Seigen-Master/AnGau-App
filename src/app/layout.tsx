import type { Metadata } from 'next';
import './globals.css';
import { Toaster }
from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'AnGau Light',
  description: 'Healthcare Management App by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <div className="font-body antialiased">
            {children}
            <Toaster />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
