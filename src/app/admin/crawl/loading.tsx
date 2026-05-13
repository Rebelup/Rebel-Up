export default function AdminCrawlLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="h-7 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* 새 브랜드 추가 박스 스켈레톤 */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-9 w-16 bg-gray-100 rounded-xl animate-pulse" />
      </div>

      {/* 브랜드 카드 스켈레톤 */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="w-7 h-7 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
