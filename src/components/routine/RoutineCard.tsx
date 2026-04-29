"use client";

import { useState } from "react";
import { Routine } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Dumbbell, Utensils, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

interface RoutineCardProps {
  routine: Routine;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function RoutineCard({ routine, completed, onToggle, onDelete }: RoutineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasItems = (routine.routine_items?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        "bg-background rounded-2xl border border-border shadow-sm overflow-hidden transition-all",
        completed && "opacity-70"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          onClick={onToggle}
          className="shrink-0 text-primary transition-transform active:scale-90"
        >
          {completed ? (
            <CheckCircle2 className="w-6 h-6 fill-primary text-white" />
          ) : (
            <Circle className="w-6 h-6 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                routine.type === "workout"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                  : "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
              )}
            >
              {routine.type === "workout" ? (
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3 h-3 inline" /> 운동
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Utensils className="w-3 h-3 inline" /> 식단
                </span>
              )}
            </span>
          </div>
          <p className={cn("font-semibold text-sm mt-0.5", completed && "line-through text-muted-foreground")}>
            {routine.title}
          </p>
          {!expanded && hasItems && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {routine.routine_items!.map((it) => it.name).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/routine/${routine.id}/edit`}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {hasItems && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {expanded && hasItems && (
        <div className="px-4 pb-3 border-t border-border/50 mt-0 pt-2 space-y-1.5">
          {routine.routine_items!.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-medium">{item.name}</span>
                {item.detail && (
                  <span className="text-xs text-muted-foreground ml-2">{item.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
