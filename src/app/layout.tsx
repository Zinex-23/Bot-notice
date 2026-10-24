import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { TelegramWebAppInit } from "@/components/TelegramWebAppInit";

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
  metadataBase: new URL("https://bot-notice.vercel.app"),
  openGraph: {
    title: "DailyFlow - Trợ lý cuộc sống & Lịch trình 24 giờ",
    description:
      "Lập kế hoạch 24 giờ thông minh, bot Telegram tương tác hai chiều và theo dõi thói quen.",
    url: "https://bot-notice.vercel.app",
    siteName: "DailyFlow Life Assistant",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DailyFlow - Trợ lý cuộc sống & Lịch trình 24 giờ",
    description: "Lập kế hoạch 24 giờ thông minh, bot Telegram tương tác hai chiều.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 dark:bg-zinc-950`}
      >
        <TelegramWebAppInit />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
