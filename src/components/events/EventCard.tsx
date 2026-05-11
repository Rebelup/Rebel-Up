import Link from "next/link";
import Image from "next/image";
import { SupplementEvent, EventType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

const TYPE_MAP: Record<EventType, { label: string; color: string }> = {
  sale: { label: "할인", color: "text-rose-500" },
  new_product: { label: "신제품", color: "text-blue-500" },
  bundle: { label: "묶음구성", color: "text-violet-500" },
  free_shipping: { label: "무료배송", color: "text-emerald-500" },
  other: { label: "이벤트", color: "text-amber-500" },
};

const BRAND_GRADIENTS: Record<string, string> = {
  on: "from-yellow-400 to-orange-400",
  gnc: "from-blue-500 to-blue-700",
  muscletech: "from-red-500 to-red-700",
  musclepharm: "from-gray-700 to-gray-900",
  rexki: "from-sky-400 to-cyan-500",
  daily: "from-teal-400 to-emerald-500",
};

function getDDay(end: string | null): string | null {
  if (!end) return null;
  const days = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return "D-day";
  return `D-${days}`;
}

export function EventCard({ event }: { event: SupplementEvent }) {
  const type = TYPE_MAP[event.event_type];
  const brand = event.supplement_brands;
  const dday = getDDay(event.end_date);
  const gradient = BRAND_GRADIENTS[brand?.slug ?? ""] ?? "from-primary/70 to-primary";
  const initials = (brand?.name ?? "?").slice(0, 2).toUpperCase();

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div className="bg-white rounded-2xl flex items-center gap-4 px-4 py-3.5 border border-gray-200 group-hover:border-gray-300 transition-colors duration-200">

        {/* 좌측 이미지 */}
        <div className="relative w-[90px] h-[90px] rounded-xl shrink-0 overflow-hidden">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="90px"
            />
          ) : (
            <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", gradient)}>
              <span className="text-white text-xl font-black tracking-tight drop-shadow-sm">{initials}</span>
            </div>
          )}
        </div>

        {/* 우측 콘텐츠 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">

          {/* 브랜드 + 타입 — 브랜드명이 길어도 한 줄 유지 */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[11px] font-medium text-muted-foreground truncate min-w-0">
              {brand?.name ?? ""}
            </span>
            <span className="text-muted-foreground/40 text-[10px] shrink-0">·</span>
            <span className={cn("text-[11px] font-semibold shrink-0", type.color)}>
              {type.label}
            </span>
          </div>

          {/* 제목 — 2줄 */}
          <p className="text-[14px] font-semibold text-gray-900 line-clamp-2 leading-snug">
            {event.title}
          </p>

          {/* 메타 — whitespace-nowrap으로 한 줄 강제 */}
          <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap overflow-hidden">
            {dday && (
              <span className={cn("font-bold shrink-0", dday === "D-day" ? "text-rose-500" : "text-primary")}>
                {dday}
              </span>
            )}
            {event.discount_rate && (
              <>
                {dday && <span className="text-gray-300 shrink-0">·</span>}
                <span className="font-bold text-rose-500 shrink-0">{event.discount_rate}% 할인</span>
              </>
            )}
            {event.is_international && (
              <>
                {(dday || event.discount_rate) && <span className="text-gray-300 shrink-0">·</span>}
                <span className="flex items-center gap-0.5 text-sky-500 font-medium shrink-0">
                  <Globe className="w-2.5 h-2.5 shrink-0" />
                  해외배송
                </span>
              </>
            )}
            {!dday && !event.discount_rate && !event.is_international && (
              <span className="text-muted-foreground">상시 진행</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl flex items-center gap-4 px-4 py-3.5 border border-gray-100">
      <div className="w-[90px] h-[90px] rounded-xl bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
