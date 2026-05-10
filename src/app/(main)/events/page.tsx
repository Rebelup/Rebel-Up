"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBrands, getActiveEvents } from "@/lib/queries/events";
import { SupplementBrand, SupplementEvent, EventType } from "@/lib/types";
import { EventCard } from "@/components/events/EventCard";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, Dumbbell } from "lucide-react";

const EVENT_TYPES: { value: EventType | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "sale", label: "할인" },
  { value: "new_product", label: "신제품" },
  { value: "bundle", label: "묶음" },
  { value: "free_shipping", label: "무료배송" },
  { value: "other", label: "기타" },
];

export default function EventsPage() {
  const [supabase] = useState(() => createClient());
  const [brands, setBrands] = useState<SupplementBrand[]>([]);
  const [events, setEvents] = useState<SupplementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<EventType | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [b, e] = await Promise.all([
          getBrands(supabase),
          getActiveEvents(supabase),
        ]);
        setBrands(b);
        setEvents(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (selectedBrand !== "all" && e.brand_id !== selectedBrand) return false;
      if (selectedType !== "all" && e.event_type !== selectedType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitle = e.title.toLowerCase().includes(q);
        const inDesc = e.description?.toLowerCase().includes(q) ?? false;
        const inBrand = (e.supplement_brands?.name ?? "").toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inBrand) return false;
      }
      return true;
    });
  }, [events, selectedBrand, selectedType, search]);

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base">보충제 이벤트</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        {/* 검색 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이벤트 검색..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* 브랜드 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
          <button
            onClick={() => setSelectedBrand("all")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              selectedBrand === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            전체 브랜드
          </button>
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBrand(selectedBrand === b.id ? "all" : b.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                selectedBrand === b.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* 이벤트 타입 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors",
                selectedType === t.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 이벤트 목록 */}
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
            <SlidersHorizontal className="w-10 h-10 opacity-30" />
            <p className="text-sm">
              {events.length === 0 ? "등록된 이벤트가 없어요." : "조건에 맞는 이벤트가 없어요."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
