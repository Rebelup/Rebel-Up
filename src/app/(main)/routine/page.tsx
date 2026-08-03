"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Routine, RoutineLog } from "@/lib/types";
import {
  getRoutinesWithItems,
  getRoutineLogs,
  getWeekLogs,
  getStreak,
  logRoutineComplete,
  unlogRoutineComplete,
  deleteRoutine,
} from "@/lib/queries/routines";
import { WeekCalendar } from "@/components/routine/WeekCalendar";
import { RoutineCard } from "@/components/routine/RoutineCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Flame, Plus, Smile } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function jsToRoutineDay(date: Date): number {
  const jsDay = date.getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1; // 0=Mon..6=Sun
}

export default function RoutinePage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [weekLogs, setWeekLogs] = useState<RoutineLog[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
    });
  }, [supabase, router]);

  // Load routines (once)
  useEffect(() => {
    if (!userId) return;
    getRoutinesWithItems(supabase, userId).then(setRoutines).catch(() => {});
    getStreak(supabase, userId).then(setStreak).catch(() => {});
  }, [userId, supabase]);

  // Load logs for selected date
  const loadLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [dayLogs] = await Promise.all([
        getRoutineLogs(supabase, userId, toDateStr(selectedDate)),
      ]);
      setLogs(dayLogs);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, selectedDate]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Load week logs for calendar dots
  useEffect(() => {
    if (!userId) return;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    getWeekLogs(supabase, userId, toDateStr(weekStart), toDateStr(weekEnd))
      .then(setWeekLogs)
      .catch(() => {});
  }, [userId, supabase, weekStart]);

  const handleWeekChange = (dir: -1 | 1) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Sync week if needed
    const monday = getMonday(date);
    if (toDateStr(monday) !== toDateStr(weekStart)) setWeekStart(monday);
  };

  const dayIndex = jsToRoutineDay(selectedDate);
  const dayRoutines = routines.filter((r) => r.days.includes(dayIndex));
  const completedIds = new Set(logs.map((l) => l.routine_id));
  const isAllDone = dayRoutines.length > 0 && dayRoutines.every((r) => completedIds.has(r.id));

  // Dates that have any log this week
  const completedDates = new Set(weekLogs.map((l) => l.log_date));

  const handleToggle = async (routine: Routine) => {
    if (!userId) return;
    const dateStr = toDateStr(selectedDate);
    const isCompleted = completedIds.has(routine.id);
    const tempId = crypto.randomUUID();

    // Optimistic
    if (isCompleted) {
      setLogs((prev) => prev.filter((l) => l.routine_id !== routine.id));
      try {
        await unlogRoutineComplete(supabase, userId, routine.id, dateStr);
        posthog.capture("routine_completion_toggled", {
          routine_id: routine.id,
          completed: false,
          routine_type: routine.type,
        });
        setStreak(await getStreak(supabase, userId));
      } catch {
        toast.error("변경에 실패했습니다.");
        loadLogs();
      }
    } else {
      setLogs((prev) => [
        ...prev,
        { id: tempId, user_id: userId, routine_id: routine.id, log_date: dateStr, created_at: new Date().toISOString() },
      ]);
      try {
        await logRoutineComplete(supabase, userId, routine.id, dateStr);
        posthog.capture("routine_completion_toggled", {
          routine_id: routine.id,
          completed: true,
          routine_type: routine.type,
        });
        setStreak(await getStreak(supabase, userId));
      } catch {
        toast.error("변경에 실패했습니다.");
        loadLogs();
      }
    }
  };

  const handleDelete = async (routine: Routine) => {
    if (!confirm(`"${routine.title}" 루틴을 삭제할까요?`)) return;
    try {
      await deleteRoutine(supabase, routine.id);
      setRoutines((prev) => prev.filter((r) => r.id !== routine.id));
      toast.success("루틴이 삭제됐어요.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem-4rem)]">
      {/* 주간 캘린더 */}
      <div className="sticky top-14 z-20">
        <WeekCalendar
          selectedDate={selectedDate}
          weekStart={weekStart}
          onSelect={handleDateSelect}
          onWeekChange={handleWeekChange}
          completedDates={completedDates}
        />
      </div>

      {/* 스트릭 배지 */}
      <div className="max-w-lg mx-auto w-full px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950 text-orange-500 px-3 py-1.5 rounded-full">
          <Flame className="w-4 h-4 fill-orange-400 text-orange-400" />
          <span className="text-sm font-bold">{streak}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {selectedDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
        </span>
      </div>

      {/* 루틴 목록 */}
      <div className="max-w-lg mx-auto w-full px-4 pb-4 flex-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : dayRoutines.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-sm">오늘 루틴이 없어요</p>
            <Link
              href="/routine/new"
              className="text-sm text-primary font-medium hover:underline"
            >
              + 루틴 추가하기
            </Link>
          </div>
        ) : isAllDone ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <Smile className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">클리어! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">내일도 화이팅이에요!</p>
            </div>
            <div className="w-full space-y-3 mt-4">
              {dayRoutines.map((r) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  completed={completedIds.has(r.id)}
                  onToggle={() => handleToggle(r)}
                  onDelete={() => handleDelete(r)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {dayRoutines.map((r) => (
              <RoutineCard
                key={r.id}
                routine={r}
                completed={completedIds.has(r.id)}
                onToggle={() => handleToggle(r)}
                onDelete={() => handleDelete(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/routine/new"
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors active:scale-95 z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
}
