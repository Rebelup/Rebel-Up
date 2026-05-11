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
      <div className="bg-white rounded-2xl flex items-center gap-3.5 px-4 h-[86px] shadow-sm border border-gray-100 group-hover:shadow-md group-hover:border-gray-200 transition-all duration-200">

        {/* 좌측 이미지 */}
        <div className="relative w-[58px] h-[58px] rounded-xl shrink-0 overflow-hidden">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="58px"
            />
          ) : (
            <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", gradient)}>
              <span className="text-white text-sm font-bold tracking-tight">{initials}</span>
            </div>
          )}
        </div>

        {/* 우측 콘텐츠 */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-[52px] py-0.5">
          {/* 브랜드 + 타입 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {brand?.name ?? ""}
            </span>
            <span className={cn("text-[11px] font-semibold shrink-0", type.color)}>
              {type.label}
            </span>
          </div>

          {/* 제목 */}
          <p className="text-[13.5px] font-semibold text-gray-900 line-clamp-1 leading-snug">
            {event.title}
          </p>

          {/* 메타 */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {dday && (
              <span className={cn("font-bold", dday === "D-day" ? "text-rose-500" : "text-primary")}>
                {dday}
              </span>
            )}
            {dday && (event.discount_rate || event.is_international) && <span className="text-gray-300">·</span>}
            {event.discount_rate && (
              <span className="font-medium text-gray-500">{event.discount_rate}% 할인</span>
            )}
            {event.discount_rate && event.is_international && <span className="text-gray-300">·</span>}
            {event.is_international && (
              <span className="flex items-center gap-0.5 text-sky-500 font-medium">
                <Globe className="w-2.5 h-2.5" />
                해외배송
              </span>
            )}
            {!dday && !event.discount_rate && !event.is_international && (
              <span>상시 진행</span>
            )}
          </div>
        </div>

        {/* 할인율 강조 배지 (우측 끝) */}
        {event.discount_rate && event.discount_rate >= 20 && (
          <div className="shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-rose-50">
            <span className="text-[11px] font-bold text-rose-500 leading-none">{event.discount_rate}%</span>
            <span className="text-[9px] text-rose-400 leading-none mt-0.5">OFF</span>
          </div>
        )}
      </div>
    </Link>
  );
}
