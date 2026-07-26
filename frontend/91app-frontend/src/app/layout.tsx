import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// ADR 0009：全站字體採用 Google Fonts Inter
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "My Work Item",
  description: "個人化工作項目管理空間",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`h-full antialiased ${inter.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
