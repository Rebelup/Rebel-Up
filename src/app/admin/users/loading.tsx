export default function AdminUsersLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="h-7 w-28 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* 검색 */}
      <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />

      {/* 테이블 */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-14 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-7 w-7 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
