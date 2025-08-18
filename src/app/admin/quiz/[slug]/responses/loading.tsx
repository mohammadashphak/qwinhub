export default function LoadingResponses() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-7 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="mt-2 h-4 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-4">
              <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="mb-4 flex items-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>

        {/* Table skeleton */}
        <div className="rounded-lg border bg-white">
          <div className="grid grid-cols-5 gap-4 p-4 border-b">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="divide-y">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 p-4">
                {[...Array(5)].map((__, j) => (
                  <div key={j} className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
