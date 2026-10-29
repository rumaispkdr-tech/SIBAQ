import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIBAQ NARIATH SWALATH — Islamic Digital Garden & 33-Count Tracker",
  description:
    "A modern, animated, relaxing web application for 151 Sibaq candidates reciting daily Nariath Swalath 33 times with peaceful emoji fireworks, relaxation corner, and real-time tracking.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#176B50",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-emerald-200 selection:text-emerald-950">
        {children}
      </body>
    </html>
  );
}
