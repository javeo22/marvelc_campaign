import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Core Protocol Companion",
    template: "%s | Core Protocol Companion"
  },
  description: "Offline-first campaign companion for the Core Protocol fan campaign.",
  applicationName: "Core Protocol Companion",
  robots: {
    index: process.env.NEXT_PUBLIC_BETA_NOINDEX !== "true",
    follow: process.env.NEXT_PUBLIC_BETA_NOINDEX !== "true"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0C1F3D"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
