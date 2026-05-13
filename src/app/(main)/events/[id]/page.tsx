import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getEventById, getActiveEvents } from "@/lib/queries/events";
import { EventCard } from "@/components/events/EventCard";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarDays, ExternalLink, Globe, Tag } from "lucide-react";
import { EventType } from "@/lib/types";

export const revalidate = 60;

const TYPE_MAP: Record<EventType, { label: string; color: string }> = {
  sale: { label: "할인", color: "bg-red-100 text-red-600" },
  new_product: { label: "신제품", color: "bg-blue-100 text-blue-600" },
  bundle: { label: "묶음", color: "bg-purple-100 text-purple-600" },
  free_shipping: { label: "무료배송", color: "bg-green-100 text-green-600" },
  other: { label: "기타", color: "bg-gray-100 text-gray-500" },
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function daysLeft(end: string | null) {
  if (!end) return null;
  const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (diff < 0) return "종료됨";
  if (diff === 0) return "오늘 마감";
  return `${diff}일 남음`;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const event = await getEventById(supabase, id);
  if (!event) notFound();

  const related = await getActiveEvents(supabase, event.brand_id, event.id);
  const type = TYPE_MAP[event.event_type];
  const brand = event.supplement_brands;
  const remaining = daysLeft(event.end_date);

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 바 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/events" className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold text-sm truncate">{brand?.name ?? "이벤트"}</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto pb-12">
        {/* 이미지 헤더 */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-primary/15 to-primary/5">
          {event.image_url ? (
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 512px) 100vw, 512px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-16 h-16 text-primary/20" />
            </div>
          )}
          {/* D-day 배지 */}
          {remaining && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {remaining}
            </div>
          )}
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* 뱃지 */}
          <div className="flex items-center gap-2 flex-wrap">
            {brand && (
              <span className="text-sm font-bold text-primary">{brand.name}</span>
            )}
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", type.color)}>
              {type.label}
            </span>
            {event.discount_rate && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                {event.discount_rate}% OFF
              </span>
            )}
            {event.is_international && (
              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-600">
                <Globe className="w-3 h-3" />
                해외배송 상품
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-xl font-bold leading-snug">{event.title}</h1>

          {/* 기간 */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4 shrink-0" />
            {event.start_date && event.end_date
              ? `${fmtDate(event.start_date)} ~ ${fmtDate(event.end_date)}`
              : event.end_date
              ? `~ ${fmtDate(event.end_date)} 까지`
              : event.start_date
              ? `${fmtDate(event.start_date)} 시작`
              : "기간 미정"}
          </div>

          {/* 구분선 */}
          <div className="border-t border-border" />

          {/* 상세 설명 */}
          {event.description && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">이벤트 상세</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* 해외배송 안내 */}
          {event.is_international && (
            <div className="rounded-xl bg-sky-50 border border-sky-200 p-3.5 space-y-1">
              <p className="text-xs font-semibold text-sky-700">해외배송 안내</p>
              <p className="text-xs text-sky-600 leading-relaxed">
                이 상품은 해외에서 배송되는 해외직구 상품입니다. 배송비 및 관부가세가 발생할 수 있으며,
                배송 기간은 국내 배송보다 길 수 있습니다 (통상 7~15일).
                이벤트 적용 조건은 각 판매처 안내를 참고해 주세요.
              </p>
            </div>
          )}

          {/* 이벤트 바로가기 버튼 */}
          {event.event_url && (
            <a
              href={event.event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              이벤트 보러가기
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* 관련 이벤트 */}
          {related.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-semibold">
                {brand?.name} 다른 이벤트 ({related.length})
              </h2>
              <div className="flex flex-col gap-3">
                {related.slice(0, 4).map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
