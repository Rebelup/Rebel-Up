import { EventCardSkeleton } from "@/components/events/EventCard";
import { Dumbbell } from "lucide-react";

export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base">보충제 이벤트</span>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-3">
        {/* 검색 스켈레톤 */}
        <div className="h-10 rounded-xl bg-gray-100 animate-pulse mb-4" />
        {/* 필터 스켈레톤 */}
        <div className="flex gap-2 mb-3">
          {[60, 48, 56, 52, 64].map((w, i) => (
            <div key={i} className={`h-7 w-[${w}px] rounded-full bg-gray-100 animate-pulse shrink-0`} />
          ))}
        </div>
        {/* 카드 스켈레톤 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
