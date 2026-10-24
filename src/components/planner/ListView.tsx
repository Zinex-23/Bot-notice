"use client";

import { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Filter, Sparkles, MoreVertical } from "lucide-react";
import { TimeSlotItem, TaskCategory } from "@/lib/schedule/types";

interface ListViewProps {
  items: TimeSlotItem[];
  onSelectItem: (item: TimeSlotItem) => void;
  onComplete: (occurrenceId: string) => Promise<void>;
}

export function ListView({ items, onSelectItem, onComplete }: ListViewProps) {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const filteredItems = items.filter((item) => {
    if (filterCategory === "ALL") return true;
    return item.category === filterCategory;
  });

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterCategory("ALL")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filterCategory === "ALL"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
          }`}
        >
          Tất cả ({items.length})
        </button>
        <button
          onClick={() => setFilterCategory("WATER")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filterCategory === "WATER"
              ? "bg-cyan-600 text-white"
              : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
          }`}
        >
          💧 Uống nước
        </button>
        <button
          onClick={() => setFilterCategory("EXERCISE")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filterCategory === "EXERCISE"
              ? "bg-emerald-600 text-white"
              : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
          }`}
        >
          🏋️ Tập thể dục
        </button>
        <button
          onClick={() => setFilterCategory("STUDY")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filterCategory === "STUDY"
              ? "bg-violet-600 text-white"
              : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
          }`}
        >
          📚 Học tập
        </button>
        <button
          onClick={() => setFilterCategory("WORK")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filterCategory === "WORK"
              ? "bg-amber-600 text-white"
              : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
          }`}
        >
          💼 Công việc
        </button>
        <button
          onClick={() => setFilterCategory("HEALTH")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
            filterCategory === "HEALTH"
              ? "bg-rose-600 text-white"
              : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
          }`}
        >
          🧘 Sức khỏe
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Không có hoạt động nào trong danh mục này.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompleted = item.status === "COMPLETED";

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="p-4 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-4">
                  {/* Completion checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete(item.occurrenceId || item.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isCompleted
                        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>

                  {/* Time Badge */}
                  <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    {item.startTime}
                  </span>

                  {/* Title and details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isCompleted
                            ? "line-through text-slate-400 dark:text-zinc-500"
                            : "text-slate-900 dark:text-zinc-100"
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.hasConflict && (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Trùng giờ</span>
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right badges */}
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  {item.targetValue && (
                    <span className="font-medium bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded border border-slate-200 dark:border-zinc-700">
                      {item.targetValue} {item.targetUnit}
                    </span>
                  )}
                  {item.durationMinutes > 0 && (
                    <span className="text-slate-400">{item.durationMinutes} phút</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
