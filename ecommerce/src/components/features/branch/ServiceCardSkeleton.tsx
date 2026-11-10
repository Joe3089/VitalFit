export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="bg-gray-200 h-40 w-full rounded-xl mb-4" />

      <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2" />

      <div className="h-4 bg-gray-100 rounded-md w-full mb-1" />
      <div className="h-4 bg-gray-100 rounded-md w-5/6 mb-6" />

      <div className="flex justify-between items-center border-t border-gray-50 pt-4">
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-12" />
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-6 bg-gray-100 rounded-md w-14" />
      </div>
    </div>
  );
}
