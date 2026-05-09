"use client";

import { SupplementEvent, EventType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarDays, ExternalLink, Tag } from "lucide-react";

const EVENT_TYPE_MAP: Record<EventType, { label: string; color: string }> = {
  sale: { label: "할인", color: "bg-red-100 text-red-600" },
  new_product: { label: "신제품", color: "bg-blue-100 text-blue-600" },
  bundle: { label: "묶음", color: "bg-purple-100 text-purple-600" },
  free_shipping: { label: "무료배송", color: "bg-green-100 text-green-600" },
  other: { label: "기타", color: "bg-gray-100 text-gray-500" },
};

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function isExpiringSoon(endDate: string | null) {
  if (!endDate) return false;
  const diff = new Date(endDate).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

interface EventCardProps {
  event: SupplementEvent;
}

export function EventCard({ event }: EventCardProps) {
  const typeInfo = EVENT_TYPE_MAP[event.event_type];
  const brandName = event.supplement_brands?.name ?? "Unknown";
  const expiring = isExpiringSoon(event.end_date);

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Image */}
      {event.image_url ? (
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <Tag className="w-10 h-10 text-primary/30" />
        </div>
      )}

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Brand + type badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">{brandName}</span>
          <span
            className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full",
              typeInfo.color
            )}
          >
            {typeInfo.label}
          </span>
          {event.discount_rate && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
              {event.discount_rate}% OFF
            </span>
          )}
          {expiring && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              마감 임박
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{event.title}</h3>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto pt-2">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          {event.start_date && event.end_date ? (
            <span>
              {formatDate(event.start_date)} ~ {formatDate(event.end_date)}
            </span>
          ) : event.end_date ? (
            <span>~ {formatDate(event.end_date)} 까지</span>
          ) : event.start_date ? (
            <span>{formatDate(event.start_date)} 부터</span>
          ) : (
            <span>기간 미정</span>
          )}
        </div>
      </div>

      {/* Footer */}
      {event.event_url && (
        <div className="px-4 pb-4">
          <a
            href={event.event_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            이벤트 보러가기
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
