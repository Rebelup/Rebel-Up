"use client";

import { useState, useMemo } from "react";
import { SupplementEvent, EventCategory } from "@/lib/types";
import { EventCard } from "@/components/events/EventCard";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal } from "lucide-react";

interface Props {
  initialEvents: SupplementEvent[];
  initialCategories: EventCategory[];
}

export function EventsClient({ initialEvents, initialCategories }: Props) {
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const parents = useMemo(
    () => initialCategories.filter((c) => !c.parent_id && c.is_active).sort((a, b) => a.display_order - b.display_order),
    [initialCategories]
  );

  const children = useMemo(
    () => selectedParent
      ? initialCategories.filter((c) => c.parent_id === selectedParent && c.is_active).sort((a, b) => a.display_order - b.display_order)
      : [],
    [initialCategories, selectedParent]
  );

  const filtered = useMemo(() => {
    return initialEvents.filter((e) => {
      if (selectedChild) {
        if (e.category_id !== selectedChild) return false;
      } else if (selectedParent) {
        const parentChildIds = initialCategories
          .filter((c) => c.parent_id === selectedParent)
          .map((c) => c.id);
        if (e.category_id !== selectedParent && !parentChildIds.includes(e.category_id ?? "")) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          (e.description?.toLowerCase().includes(q) ?? false) ||
          (e.supplement_brands?.name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialEvents, initialCategories, selectedParent, selectedChild, search]);

  const selectParent = (id: string | null) => {
    setSelectedParent(id);
    setSelectedChild(null);
  };

  const hasCategories = parents.length > 0;

  return (
    <>
      {/* 검색 */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이벤트 검색..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* 1차 카테고리 */}
      {hasCategories && (
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1 mb-1 scrollbar-hide">
          <button
            onClick={() => selectParent(null)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-150",
              selectedParent === null
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            전체
          </button>
          {parents.map((p) => (
            <button
              key={p.id}
              onClick={() => selectParent(selectedParent === p.id ? null : p.id)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-150",
                selectedParent === p.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* 2차 카테고리 */}
      {children.length > 0 && (
        <div className="flex items-center gap-0.5 overflow-x-auto pb-3 mb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedChild(null)}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150",
              selectedChild === null
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            전체
          </button>
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChild(selectedChild === c.id ? null : c.id)}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150",
                selectedChild === c.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {!hasCategories && <div className="mb-3" />}

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <SlidersHorizontal className="w-10 h-10 opacity-30" />
          <p className="text-sm">
            {initialEvents.length === 0 ? "등록된 이벤트가 없어요." : "조건에 맞는 이벤트가 없어요."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  );
}

export function EventsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl flex items-center gap-4 px-4 py-3.5 border border-gray-200">
          <div className="w-[90px] h-[90px] rounded-xl bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
            <div className="flex gap-1.5">
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-5 w-12 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
