"use client";

import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  LayoutList,
  CalendarRange,
  AlertTriangle,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { getVietnamDateString } from "@/lib/schedule/engine";
import { TimeSlotItem } from "@/lib/schedule/types";
import { Timeline24Hour } from "@/components/planner/Timeline24Hour";
import { ListView } from "@/components/planner/ListView";
import { WeeklyView } from "@/components/planner/WeeklyView";
import { AddReminderModal } from "@/components/planner/AddReminderModal";
import { EditReminderModal } from "@/components/planner/EditReminderModal";

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<"TIMELINE" | "LIST" | "WEEK">("TIMELINE");
  const [plannerData, setPlannerData] = useState<{
    items: TimeSlotItem[];
    conflicts: any[];
    summary: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      completionRate: number;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quickAddStartTime, setQuickAddStartTime] = useState("09:00");
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<TimeSlotItem | null>(null);

  const fetchPlanner = async (dateStr: string) => {
    if (!dateStr) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/planner?date=${dateStr}`);
      const data = await res.json();
      setPlannerData(data);
    } catch (err) {
      console.error("Failed to load planner data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const today = getVietnamDateString();
    setSelectedDate(today);
    fetchPlanner(today);
  }, []);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    fetchPlanner(newDate);
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(getVietnamDateString(current));
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(getVietnamDateString(current));
  };

  const handleToday = () => {
    setSelectedDate(getVietnamDateString());
  };

  const handleQuickAdd = (startTime: string) => {
    setQuickAddStartTime(startTime);
    setIsAddModalOpen(true);
  };

  const handleReschedule = async (occurrenceId: string, newStartTime: string) => {
    try {
      const res = await fetch(`/api/planner/${occurrenceId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStartTime }),
      });
      if (res.ok) {
        await fetchPlanner(selectedDate);
      }
    } catch (err) {
      console.error("Failed to reschedule:", err);
    }
  };

  const handleComplete = async (occurrenceId: string) => {
    try {
      const res = await fetch(`/api/planner/${occurrenceId}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchPlanner(selectedDate);
      }
    } catch (err) {
      console.error("Failed to complete:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2.5">
            <span>Lịch 24 Giờ</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              00:00 - 23:59
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Trung tâm điều khiển và lập kế hoạch năng suất cá nhân trong ngày.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View mode buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode("TIMELINE")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "TIMELINE"
                  ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Trục 24h</span>
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "LIST"
                  ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
            <button
              onClick={() => setViewMode("WEEK")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "WEEK"
                  ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Tuần</span>
            </button>
          </div>

          {/* Add reminder primary button */}
          <button
            onClick={() => {
              setQuickAddStartTime("09:00");
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm lịch nhắc</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Summary Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
        {/* Date Selector */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
          />

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleToday}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200"
          >
            Hôm nay
          </button>
        </div>

        {/* Quick Day Metrics */}
        {plannerData && (
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Tổng cộng:</span>
              <span className="font-bold text-slate-800 dark:text-zinc-200">
                {plannerData.summary.totalTasks} việc
              </span>
            </div>
            <span className="text-slate-200 dark:text-zinc-700">|</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Đã xong:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {plannerData.summary.completedTasks} ({plannerData.summary.completionRate}%)
              </span>
            </div>
            {plannerData.conflicts?.length > 0 && (
              <>
                <span className="text-slate-200 dark:text-zinc-700">|</span>
                <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{plannerData.conflicts.length} xung đột giờ</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <div className="p-16 text-center text-sm text-slate-400">
          Đang tải dữ liệu lịch trình...
        </div>
      ) : (
        <>
          {viewMode === "TIMELINE" && (
            <Timeline24Hour
              items={plannerData?.items || []}
              onSelectItem={(item) => setSelectedItemForEdit(item)}
              onQuickAdd={handleQuickAdd}
              onReschedule={handleReschedule}
              onComplete={handleComplete}
            />
          )}

          {viewMode === "LIST" && (
            <ListView
              items={plannerData?.items || []}
              onSelectItem={(item) => setSelectedItemForEdit(item)}
              onComplete={handleComplete}
            />
          )}

          {viewMode === "WEEK" && (
            <WeeklyView
              onSelectItemDate={(dateStr) => {
                setSelectedDate(dateStr);
                setViewMode("TIMELINE");
              }}
            />
          )}
        </>
      )}

      {/* Add Modal */}
      <AddReminderModal
        isOpen={isAddModalOpen}
        initialStartTime={quickAddStartTime}
        defaultDate={selectedDate}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchPlanner(selectedDate)}
      />

      {/* Edit Modal */}
      <EditReminderModal
        item={selectedItemForEdit}
        isOpen={Boolean(selectedItemForEdit)}
        onClose={() => setSelectedItemForEdit(null)}
        onSuccess={() => fetchPlanner(selectedDate)}
      />
    </div>
  );
}
