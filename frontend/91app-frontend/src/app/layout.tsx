import type { Metadata } from "next";
import "./globals.css";

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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
