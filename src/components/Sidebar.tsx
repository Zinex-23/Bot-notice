"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  CheckSquare,
  Flame,
  Droplets,
  BarChart3,
  History,
  Settings,
  Sparkles,
  X,
  Menu,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/overview", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/planner", label: "Lịch 24 giờ", icon: CalendarClock, primary: true },
  { href: "/tasks", label: "Công việc", icon: CheckSquare },
  { href: "/habits", label: "Thói quen", icon: Flame },
  { href: "/water", label: "Uống nước", icon: Droplets },
  { href: "/analytics", label: "Thống kê", icon: BarChart3 },
  { href: "/history", label: "Lịch sử", icon: History },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

/**
 * 1. Desktop Sidebar (Only visible on screens >= md)
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-col justify-between h-screen sticky top-0 flex-shrink-0 z-20">
      <div>
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-200 dark:border-zinc-800 px-6 flex items-center justify-between">
          <Link href="/overview" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-zinc-100 text-lg tracking-tight">
                Daily<span className="text-blue-600 dark:text-blue-400">Flow</span>
              </span>
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest -mt-1">
                Life Assistant
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/overview" && pathname === "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 dark:text-zinc-500"
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {item.primary && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Chính
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
        <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-slate-200/60 dark:border-zinc-700/50">
          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Hệ thống điều hành
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Đồng bộ thời gian thực với Telegram & Cron.
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * 2. Mobile Drawer Navigation (Slide-over for phone screens)
 */
export function MobileDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over menu panel */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Header */}
          <div className="h-16 border-b border-slate-200 dark:border-zinc-800 px-5 flex items-center justify-between">
            <Link
              href="/overview"
              onClick={onClose}
              className="flex items-center space-x-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-zinc-100 text-base tracking-tight">
                  Daily<span className="text-blue-600 dark:text-blue-400">Flow</span>
                </span>
                <span className="block text-[9px] font-medium text-slate-400 uppercase tracking-widest -mt-1">
                  Life Assistant
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/overview" && pathname === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm font-semibold"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 dark:text-zinc-500"
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.primary && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      Chính
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            DailyFlow v2.0
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Đồng bộ 2 chiều với Telegram Bot.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Mobile Bottom Navigation Bar (Docked at the bottom for phones)
 */
export function MobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  const PRIMARY_MOBILE_TABS = [
    { href: "/overview", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/planner", label: "Lịch 24h", icon: CalendarClock },
    { href: "/water", label: "Uống nước", icon: Droplets },
    { href: "/analytics", label: "Thống kê", icon: BarChart3 },
    { href: "/settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-zinc-800 md:hidden flex items-center justify-around py-1.5 px-2 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-lg">
      {PRIMARY_MOBILE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          pathname === tab.href ||
          (tab.href === "/overview" && pathname === "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors ${
              isActive
                ? "text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? "bg-blue-50 dark:bg-blue-950/60" : ""}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </Link>
        );
      })}

      {/* More / Menu Button */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 rounded-xl"
        aria-label="Mở menu đầy đủ"
      >
        <div className="p-1">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Thêm</span>
      </button>
    </nav>
  );
}
