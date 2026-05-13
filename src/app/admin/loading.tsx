export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <div className="h-7 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-border">
            <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse mb-3" />
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mb-1" />
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-border space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-6 w-14 bg-gray-100 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
