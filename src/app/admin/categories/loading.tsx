export default function AdminCategoriesLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="h-7 w-36 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
            <div className="w-5 h-5 bg-gray-100 rounded animate-pulse shrink-0" />
            <div className="w-3 h-6 bg-gray-100 rounded animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-6 w-12 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-7 w-7 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>

      <div className="h-10 w-32 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
}
