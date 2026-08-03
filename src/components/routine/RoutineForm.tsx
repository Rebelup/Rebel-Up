"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Routine, RoutineType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { createRoutine, updateRoutine } from "@/lib/queries/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Dumbbell, Utensils, Loader2 } from "lucide-react";
import posthog from "posthog-js";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

interface ItemDraft {
  key: string;
  name: string;
  detail: string;
}

interface RoutineFormProps {
  routine?: Routine;
  userId: string;
}

export function RoutineForm({ routine, userId }: RoutineFormProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [title, setTitle] = useState(routine?.title ?? "");
  const [type, setType] = useState<RoutineType>(routine?.type ?? "workout");
  const [days, setDays] = useState<number[]>(routine?.days ?? []);
  const [items, setItems] = useState<ItemDraft[]>(
    routine?.routine_items?.map((it) => ({
      key: it.id,
      name: it.name,
      detail: it.detail ?? "",
    })) ?? [{ key: crypto.randomUUID(), name: "", detail: "" }]
  );
  const [saving, setSaving] = useState(false);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { key: crypto.randomUUID(), name: "", detail: "" }]);
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const updateItem = (key: string, field: "name" | "detail", value: string) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("루틴 이름을 입력해주세요.");
    if (days.length === 0) return toast.error("요일을 하나 이상 선택해주세요.");

    const validItems = items.filter((it) => it.name.trim());
    setSaving(true);
    try {
      if (routine) {
        await updateRoutine(supabase, routine.id, {
          title: title.trim(),
          type,
          days,
          items: validItems.map((it) => ({ name: it.name.trim(), detail: it.detail.trim() || undefined })),
        });
        posthog.capture("routine_updated", {
          routine_type: type,
          scheduled_day_count: days.length,
          item_count: validItems.length,
        });
        toast.success("루틴이 수정됐어요.");
      } else {
        await createRoutine(supabase, userId, {
          title: title.trim(),
          type,
          days,
          items: validItems.map((it) => ({ name: it.name.trim(), detail: it.detail.trim() || undefined })),
        });
        posthog.capture("routine_created", {
          routine_type: type,
          scheduled_day_count: days.length,
          item_count: validItems.length,
        });
        toast.success("루틴이 추가됐어요.");
      }
      router.push("/routine");
      router.refresh();
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 루틴 이름 */}
      <div className="space-y-2">
        <Label htmlFor="title">루틴 이름</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 가슴/삼두 운동"
          maxLength={50}
        />
      </div>

      {/* 타입 */}
      <div className="space-y-2">
        <Label>종류</Label>
        <div className="flex gap-2">
          {(["workout", "diet"] as RoutineType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                type === t
                  ? t === "workout"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-green-500 text-white border-green-500"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {t === "workout" ? <Dumbbell className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
              {t === "workout" ? "운동" : "식단"}
            </button>
          ))}
        </div>
      </div>

      {/* 요일 */}
      <div className="space-y-2">
        <Label>요일</Label>
        <div className="flex gap-1.5">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={cn(
                "flex-1 h-9 rounded-full text-sm font-semibold transition-all",
                days.includes(i)
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
                i === 5 && !days.includes(i) && "text-blue-500",
                i === 6 && !days.includes(i) && "text-red-500"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 항목 */}
      <div className="space-y-2">
        <Label>{type === "workout" ? "운동 목록" : "식단 목록"}</Label>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.key} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1.5">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(item.key, "name", e.target.value)}
                  placeholder={type === "workout" ? "예: 벤치프레스" : "예: 닭가슴살"}
                />
                <Input
                  value={item.detail}
                  onChange={(e) => updateItem(item.key, "detail", e.target.value)}
                  placeholder={type === "workout" ? "예: 3세트 × 10회 / 60kg" : "예: 200g / 165kcal"}
                  className="text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.key)}
                className="mt-1 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="w-full gap-1.5 text-muted-foreground"
        >
          <Plus className="w-4 h-4" />
          항목 추가
        </Button>
      </div>

      {/* 저장 */}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : routine ? "수정 완료" : "루틴 추가"}
      </Button>
    </form>
  );
}
