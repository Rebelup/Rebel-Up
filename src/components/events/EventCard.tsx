import Link from "next/link";
import Image from "next/image";
import { SupplementEvent, EventType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarDays, Globe, Tag } from "lucide-react";

const TYPE_MAP: Record<EventType, { label: string; color: string }> = {
  sale: { label: "할인", color: "bg-red-100 text-red-600" },
  new_product: { label: "신제품", color: "bg-blue-100 text-blue-600" },
  bundle: { label: "묶음", color: "bg-purple-100 text-purple-600" },
  free_shipping: { label: "무료배송", color: "bg-green-100 text-green-600" },
  other: { label: "기타", color: "bg-gray-100 text-gray-500" },
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function isExpiringSoon(end: string | null) {
  if (!end) return false;
  const diff = new Date(end).getTime() - Date.now();
  return diff > 0 && diff < 3 * 86400 * 1000;
}

export function EventCard({ event }: { event: SupplementEvent }) {
  const type = TYPE_MAP[event.event_type];
  const brand = event.supplement_brands?.name ?? "";
  const expiring = isExpiringSoon(event.end_date);

  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex items-stretch hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.99]">
        {/* 좌측 이미지 */}
        <div className="relative w-24 shrink-0 bg-gradient-to-br from-primary/10 to-primary/5">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-7 h-7 text-primary/30" />
            </div>
          )}
        </div>

        {/* 우측 콘텐츠 */}
        <div className="flex flex-col justify-center gap-1.5 px-3 py-3 flex-1 min-w-0">
          {/* 뱃지 행 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-muted-foreground">{brand}</span>
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", type.color)}>
              {type.label}
            </span>
            {event.discount_rate && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                {event.discount_rate}% OFF
              </span>
            )}
            {event.is_international && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-600">
                <Globe className="w-2.5 h-2.5" />
                해외배송
              </span>
            )}
            {expiring && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                마감임박
              </span>
            )}
          </div>

          {/* 제목 */}
          <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground">
            {event.title}
          </p>

          {/* 날짜 */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CalendarDays className="w-3 h-3 shrink-0" />
            {event.start_date && event.end_date
              ? `${fmtDate(event.start_date)} ~ ${fmtDate(event.end_date)}`
              : event.end_date
              ? `~ ${fmtDate(event.end_date)} 까지`
              : event.start_date
              ? `${fmtDate(event.start_date)} 부터`
              : "기간 미정"}
          </div>
        </div>
      </div>
    </Link>
  );
}
