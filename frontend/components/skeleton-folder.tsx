export function SkeletonFolder() {
  return (
    <div className="relative animate-pulse">
      <div className="paper-card p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-[#EFEBE3] rounded-lg" />
          <div className="flex-1">
            <div className="h-6 bg-[#EFEBE3] rounded-lg w-1/3 mb-2" />
            <div className="h-4 bg-[#EFEBE3] rounded-lg w-2/3 mb-3" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-[#EFEBE3] rounded-full" />
              <div className="h-5 w-16 bg-[#EFEBE3] rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -top-3 left-6 h-8 w-24 bg-[#EFEBE3] rounded-t-lg" />
    </div>
  )
}
