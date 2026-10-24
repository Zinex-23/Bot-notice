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
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/overview", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/planner", label: "Lịch 24 giờ", icon: CalendarClock, primary: true },
  { href: "/tasks", label: "Công việc", icon: CheckSquare },
  { href: "/habits", label: "Thói quen", icon: Flame },
  { href: "/water", label: "Uống nước", icon: Droplets },
  { href: "/analytics", label: "Thống kê", icon: BarChart3 },
  { href: "/history", label: "Lịch sử", icon: History },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between h-screen sticky top-0">
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
