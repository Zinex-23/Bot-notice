"use client";

import { useEffect, useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  Plus,
  Droplets,
  Dumbbell,
  BookOpen,
  Briefcase,
  Heart,
  Target,
  GripVertical,
} from "lucide-react";
import { TimeSlotItem, TaskCategory } from "@/lib/schedule/types";
import { timeStringToMinutes, minutesToTimeString, getVietnamTimeComponents } from "@/lib/schedule/engine";

interface Timeline24HourProps {
  items: TimeSlotItem[];
  onSelectItem: (item: TimeSlotItem) => void;
  onQuickAdd: (startTime: string) => void;
  onReschedule: (occurrenceId: string, newStartTime: string) => Promise<void>;
  onComplete: (occurrenceId: string) => Promise<void>;
}

const CATEGORY_STYLES: Record<
  TaskCategory,
  { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  WATER: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-300 dark:border-cyan-800",
    icon: Droplets,
  },
  EXERCISE: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-800",
    icon: Dumbbell,
  },
  STUDY: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-300 dark:border-violet-800",
    icon: BookOpen,
  },
  WORK: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-800",
    icon: Briefcase,
  },
  HEALTH: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-300 dark:border-rose-800",
    icon: Heart,
  },
  OTHER: {
    bg: "bg-slate-50 dark:bg-zinc-800/60",
    text: "text-slate-700 dark:text-zinc-300",
    border: "border-slate-300 dark:border-zinc-700",
    icon: Target,
  },
};

// Droppable Hour Slot component
function HourSlot({
  hour,
  onQuickAdd,
}: {
  hour: number;
  onQuickAdd: (time: string) => void;
}) {
  const hourStr = hour.toString().padStart(2, "0") + ":00";
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-20 border-b border-slate-100 dark:border-zinc-800/80 relative group flex items-start transition-colors ${
        isOver ? "bg-blue-50/60 dark:bg-blue-950/30" : "hover:bg-slate-50/50 dark:hover:bg-zinc-800/20"
      }`}
    >
      {/* Hour label */}
      <div className="w-16 flex-shrink-0 text-right pr-4 text-xs font-mono font-medium text-slate-400 dark:text-zinc-500 pt-1">
        {hourStr}
      </div>

      {/* Grid line & Slot background */}
      <div className="flex-1 h-full border-l border-slate-200 dark:border-zinc-800 relative">
        <button
          onClick={() => onQuickAdd(hourStr)}
          title={`Thêm lịch nhắc vào lúc ${hourStr}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/90 dark:bg-zinc-800/90 shadow-sm border border-slate-200 dark:border-zinc-700 z-10"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm lúc {hourStr}</span>
        </button>
      </div>
    </div>
  );
}

// Draggable Task Card
function DraggableTaskCard({
  item,
  onSelect,
  onComplete,
}: {
  item: TimeSlotItem;
  onSelect: () => void;
  onComplete: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.occurrenceId || item.id,
    data: { item },
  });

  const styleConfig = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.OTHER;
  const CategoryIcon = styleConfig.icon;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 40,
      }
    : undefined;

  const isCompleted = item.status === "COMPLETED";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border p-3 shadow-sm transition-all flex flex-col justify-between cursor-pointer ${
        styleConfig.bg
      } ${styleConfig.border} ${isDragging ? "opacity-60 shadow-xl scale-102 ring-2 ring-blue-500" : ""} ${
        isCompleted ? "opacity-75" : ""
      }`}
      onClick={onSelect}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between space-x-2">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title="Kéo thả để dời giờ"
            className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="p-1 rounded-lg bg-white/60 dark:bg-zinc-800/60 flex-shrink-0">
            <CategoryIcon className={`w-3.5 h-3.5 ${styleConfig.text}`} />
          </div>

          <span
            className={`font-semibold text-sm truncate ${
              isCompleted ? "line-through text-slate-500 dark:text-zinc-400" : "text-slate-900 dark:text-zinc-100"
            }`}
          >
            {item.title}
          </span>
        </div>

        {/* Complete Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(e);
          }}
          title={isCompleted ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
          className={`p-1 rounded-lg transition-colors ${
            isCompleted
              ? "text-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/60"
              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>

      {/* Conflict Warning */}
      {item.hasConflict && (
        <div
          title="Hoạt động này trùng thời gian với công việc khác"
          className="mt-1.5 flex items-center space-x-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md"
        >
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">⚠️ Trùng thời gian</span>
        </div>
      )}

      {/* Bottom Metadata */}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
        <span className="font-mono font-medium">
          {item.startTime} {item.durationMinutes ? `(${item.durationMinutes}p)` : ""}
        </span>

        {item.targetValue && (
          <span className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-zinc-800/80 text-[11px] font-medium">
            {item.targetValue} {item.targetUnit}
          </span>
        )}
      </div>
    </div>
  );
}

export function Timeline24Hour({
  items,
  onSelectItem,
  onQuickAdd,
  onReschedule,
  onComplete,
}: Timeline24HourProps) {
  const [currentMinute, setCurrentMinute] = useState<number>(0);

  // Track live current minute in Vietnam timezone
  useEffect(() => {
    const updateMinute = () => {
      const { hour, minute } = getVietnamTimeComponents();
      setCurrentMinute(hour * 60 + minute);
    };

    updateMinute();
    const interval = setInterval(updateMinute, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group items by hour for intuitive layout
  const itemsByHour = useMemo(() => {
    const map: Record<number, TimeSlotItem[]> = {};
    for (let h = 0; h < 24; h++) map[h] = [];

    items.forEach((item) => {
      const mins = timeStringToMinutes(item.startTime);
      const hour = Math.floor(mins / 60);
      if (map[hour]) {
        map[hour].push(item);
      }
    });

    return map;
  }, [items]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const occurrenceId = active.id.toString();
    const overHour = over.data.current?.hour as number;

    if (overHour !== undefined) {
      // Keep original minutes or snap to :00
      const activeItem = active.data.current?.item as TimeSlotItem;
      const originalMins = timeStringToMinutes(activeItem?.startTime || "00:00");
      const remMins = originalMins % 60;
      const newMins = overHour * 60 + remMins;
      const newTimeStr = minutesToTimeString(newMins);

      await onReschedule(occurrenceId, newTimeStr);
    }
  };

  // Calculate current time line position in pixels (each hour = 80px)
  const currentLineTop = (currentMinute / 60) * 80;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        {/* Header Ribbon */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-800/40 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">
              Trục thời gian 24 Giờ (00:00 - 23:59)
            </span>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <span>Kéo thả thẻ hoạt động để dời giờ</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-rose-600 dark:text-rose-400 font-medium">Giờ hiện tại</span>
          </div>
        </div>

        {/* 24-Hour Scrollable Container */}
        <div className="relative overflow-y-auto max-h-[750px]">
          {/* Live Current Time Red Bar */}
          <div
            style={{ top: `${currentLineTop}px` }}
            className="absolute left-16 right-0 z-20 pointer-events-none flex items-center"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 -ml-1.5"></div>
            <div className="flex-1 h-[2px] bg-rose-500/80 shadow-sm"></div>
          </div>

          {/* 24 Hours Loop */}
          {Array.from({ length: 24 }).map((_, hour) => {
            const hourItems = itemsByHour[hour] || [];

            return (
              <div key={hour} className="relative">
                <HourSlot hour={hour} onQuickAdd={onQuickAdd} />

                {/* Scheduled Items in this hour */}
                {hourItems.length > 0 && (
                  <div className="absolute left-20 right-4 top-2 z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {hourItems.map((item) => (
                      <DraggableTaskCard
                        key={item.id}
                        item={item}
                        onSelect={() => onSelectItem(item)}
                        onComplete={() => onComplete(item.occurrenceId || item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
