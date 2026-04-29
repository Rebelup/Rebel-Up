import { SupabaseClient } from "@supabase/supabase-js";
import { Routine, RoutineItem, RoutineLog } from "@/lib/types";

export async function getRoutinesWithItems(
  supabase: SupabaseClient,
  userId: string
): Promise<Routine[]> {
  const { data, error } = await supabase
    .from("routines")
    .select("*, routine_items(*)")
    .eq("user_id", userId)
    .order("order_index")
    .order("order_index", { referencedTable: "routine_items" });
  if (error) throw error;
  return data ?? [];
}

export async function getRoutineById(
  supabase: SupabaseClient,
  routineId: string
): Promise<Routine | null> {
  const { data, error } = await supabase
    .from("routines")
    .select("*, routine_items(*)")
    .eq("id", routineId)
    .order("order_index", { referencedTable: "routine_items" })
    .single();
  if (error) return null;
  return data;
}

export async function getRoutineLogs(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string
): Promise<RoutineLog[]> {
  const { data, error } = await supabase
    .from("routine_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", dateStr);
  if (error) throw error;
  return data ?? [];
}

export async function getWeekLogs(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string,
  weekEnd: string
): Promise<RoutineLog[]> {
  const { data, error } = await supabase
    .from("routine_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", weekStart)
    .lte("log_date", weekEnd);
  if (error) throw error;
  return data ?? [];
}

export async function logRoutineComplete(
  supabase: SupabaseClient,
  userId: string,
  routineId: string,
  logDate: string
): Promise<void> {
  const { error } = await supabase
    .from("routine_logs")
    .insert({ user_id: userId, routine_id: routineId, log_date: logDate });
  if (error) throw error;
}

export async function unlogRoutineComplete(
  supabase: SupabaseClient,
  userId: string,
  routineId: string,
  logDate: string
): Promise<void> {
  const { error } = await supabase
    .from("routine_logs")
    .delete()
    .eq("user_id", userId)
    .eq("routine_id", routineId)
    .eq("log_date", logDate);
  if (error) throw error;
}

export async function createRoutine(
  supabase: SupabaseClient,
  userId: string,
  data: {
    title: string;
    type: "workout" | "diet";
    days: number[];
    items: { name: string; detail?: string }[];
  }
): Promise<Routine> {
  const { count } = await supabase
    .from("routines")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: routine, error } = await supabase
    .from("routines")
    .insert({
      user_id: userId,
      title: data.title,
      type: data.type,
      days: data.days,
      order_index: count ?? 0,
    })
    .select()
    .single();
  if (error) throw error;

  if (data.items.length > 0) {
    const { error: itemsError } = await supabase.from("routine_items").insert(
      data.items.map((item, i) => ({
        routine_id: routine.id,
        name: item.name,
        detail: item.detail ?? null,
        order_index: i,
      }))
    );
    if (itemsError) throw itemsError;
  }

  return routine;
}

export async function updateRoutine(
  supabase: SupabaseClient,
  routineId: string,
  data: {
    title: string;
    type: "workout" | "diet";
    days: number[];
    items: { name: string; detail?: string }[];
  }
): Promise<void> {
  const { error } = await supabase
    .from("routines")
    .update({
      title: data.title,
      type: data.type,
      days: data.days,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routineId);
  if (error) throw error;

  await supabase.from("routine_items").delete().eq("routine_id", routineId);

  if (data.items.length > 0) {
    const { error: itemsError } = await supabase.from("routine_items").insert(
      data.items.map((item, i) => ({
        routine_id: routineId,
        name: item.name,
        detail: item.detail ?? null,
        order_index: i,
      }))
    );
    if (itemsError) throw itemsError;
  }
}

export async function deleteRoutine(
  supabase: SupabaseClient,
  routineId: string
): Promise<void> {
  const { error } = await supabase.from("routines").delete().eq("id", routineId);
  if (error) throw error;
}

export async function getStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 90);

  const { data: logs } = await supabase
    .from("routine_logs")
    .select("log_date")
    .eq("user_id", userId)
    .gte("log_date", startDate.toISOString().split("T")[0])
    .order("log_date", { ascending: false });

  if (!logs || logs.length === 0) return 0;

  const loggedDates = new Set(logs.map((l) => l.log_date));
  let streak = 0;
  const current = new Date(today);

  while (true) {
    const dateStr = current.toISOString().split("T")[0];
    if (loggedDates.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
