export function SkeletonContribution() {
  return (
    <div className="paper-card p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-10 w-10 bg-[#EFEBE3] rounded-full" />
        <div className="flex-1">
          <div className="h-5 bg-[#EFEBE3] rounded-lg w-32 mb-2" />
          <div className="h-4 bg-[#EFEBE3] rounded-lg w-24" />
        </div>
        <div className="h-6 w-20 bg-[#EFEBE3] rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-[#EFEBE3] rounded-lg w-full" />
        <div className="h-4 bg-[#EFEBE3] rounded-lg w-11/12" />
        <div className="h-4 bg-[#EFEBE3] rounded-lg w-4/5" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-[#EFEBE3] rounded-lg" />
        <div className="h-8 w-20 bg-[#EFEBE3] rounded-lg" />
      </div>
    </div>
  )
}
