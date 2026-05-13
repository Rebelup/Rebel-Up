export default function AdminEventsLoading() {
  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex gap-2 border-b border-border pb-3">
        <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* 툴바 */}
      <div className="flex items-center gap-2">
        <div className="h-9 flex-1 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-9 w-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-9 w-24 bg-gray-100 rounded-xl animate-pulse" />
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[90px_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-border">
          {["이미지", "이벤트", "브랜드", "상태", ""].map((h) => (
            <div key={h} className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[90px_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-border last:border-0">
            <div className="w-12 h-12 rounded-lg bg-gray-100 animate-pulse" />
            <div className="space-y-1.5 flex flex-col justify-center">
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse self-center" />
            <div className="h-6 w-12 bg-gray-100 rounded-full animate-pulse self-center" />
            <div className="flex gap-1 self-center">
              <div className="h-7 w-7 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-7 w-7 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
