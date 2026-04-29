"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

interface WeekCalendarProps {
  selectedDate: Date;
  weekStart: Date;
  onSelect: (date: Date) => void;
  onWeekChange: (direction: -1 | 1) => void;
  completedDates?: Set<string>;
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export function WeekCalendar({
  selectedDate,
  weekStart,
  onSelect,
  onWeekChange,
  completedDates,
}: WeekCalendarProps) {
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const today = toDateStr(new Date());
  const selectedStr = toDateStr(selectedDate);
  const monthYear = `${weekDates[0].getFullYear()}년 ${weekDates[0].getMonth() + 1}월`;

  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-lg mx-auto px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onWeekChange(-1)}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-bold">{monthYear}</span>
          <button
            onClick={() => onWeekChange(1)}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {weekDates.map((date, i) => {
            const dateStr = toDateStr(date);
            const isSelected = dateStr === selectedStr;
            const isToday = dateStr === today;
            const hasLog = completedDates?.has(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => onSelect(date)}
                className="flex flex-col items-center gap-1 py-1"
              >
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    i === 5 ? "text-blue-500" : i === 6 ? "text-red-500" : "text-muted-foreground"
                  )}
                >
                  {DAY_LABELS[i]}
                </span>
                <span
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all",
                    isSelected
                      ? "bg-foreground text-background"
                      : isToday
                      ? "border-2 border-foreground text-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {date.getDate()}
                </span>
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    hasLog ? "bg-primary" : "bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
