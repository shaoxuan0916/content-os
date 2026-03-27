import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content OS v1",
  description: "Internal content operating system for AI and tech story discovery.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
