import type { Metadata } from "next";
import "./globals.css";
// 1. AuthProvider ko import kiya
import { AuthProvider } from './contexts/AuthContext';

export const metadata: Metadata = {
  title: "EventSnap AI",
  description: "Smart Event Photo Sharing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* 2. Provider ko body ke andar aur children ke bahar lapet diya */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}