export function SkeletonNotesPage() {
  return (
    <div className="animate-pulse">
      {/* Toolbar skeleton */}
      <div className="paper-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-[#EFEBE3] rounded-lg" />
            <div className="h-9 w-9 bg-[#EFEBE3] rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-[#EFEBE3] rounded-lg" />
            <div className="h-9 w-24 bg-[#EFEBE3] rounded-lg" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 bg-[#EFEBE3] rounded-lg w-2/3 mb-8" />

        <div className="space-y-3">
          <div className="h-4 bg-[#EFEBE3] rounded-lg w-full" />
          <div className="h-4 bg-[#EFEBE3] rounded-lg w-11/12" />
          <div className="h-4 bg-[#EFEBE3] rounded-lg w-10/12" />
          <div className="h-4 bg-[#EFEBE3] rounded-lg w-full" />
        </div>

        <div className="h-40 bg-[#EFEBE3] rounded-2xl mt-8" />

        <div className="space-y-3 mt-8">
          <div className="h-4 bg-[#EFEBE3] rounded-lg w-full" />
          <div className="h-4 bg-[#EFEBE3] rounded-lg w-10/12" />
          <div className="h-4 bg-[#EFEBE3] rounded-lg w-11/12" />
        </div>
      </div>
    </div>
  )
}
