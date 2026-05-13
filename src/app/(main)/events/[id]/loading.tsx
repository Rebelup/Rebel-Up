import { ArrowLeft } from "lucide-react";

export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </header>
      <div className="max-w-lg mx-auto pb-12">
        {/* 이미지 헤더 */}
        <div className="w-full aspect-video bg-gray-100 animate-pulse" />
        <div className="px-4 pt-5 space-y-4">
          {/* 배지 */}
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-5 w-12 bg-gray-100 rounded-full animate-pulse" />
          </div>
          {/* 제목 */}
          <div className="space-y-2">
            <div className="h-6 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse" />
          </div>
          {/* 기간 */}
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="border-t border-border" />
          {/* 설명 */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
          </div>
          {/* CTA 버튼 */}
          <div className="h-13 w-full bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
