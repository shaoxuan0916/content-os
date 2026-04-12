import type { Metadata } from "next";
import { QueryProvider } from "@/components/content-os/query-provider";
import { ThemeScript } from "@/components/content-os/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Pulse",
  description: "Latest AI and tech news from curated sources.",
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
      <body className="font-sans antialiased">
        <ThemeScript />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
