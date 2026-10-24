import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DailyFlow - Trợ lý cuộc sống & Lịch trình 24 giờ",
  description:
    "Trung tâm điều hành năng suất cá nhân với lịch 24 giờ động, bot Telegram tương tác và thống kê đa chiều.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 dark:bg-zinc-950`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
