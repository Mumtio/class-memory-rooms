export function SkeletonCard() {
  return (
    <div className="paper-card p-6 animate-pulse">
      <div className="h-6 bg-[#EFEBE3] rounded-lg w-3/4 mb-3" />
      <div className="h-4 bg-[#EFEBE3] rounded-lg w-1/2 mb-4" />
      <div className="h-4 bg-[#EFEBE3] rounded-lg w-full mb-2" />
      <div className="h-4 bg-[#EFEBE3] rounded-lg w-5/6" />
    </div>
  )
}

export function SkeletonSubjectCard() {
  return (
    <div className="paper-card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-8 w-8 bg-[#EFEBE3] rounded-full" />
        <div className="h-6 w-12 bg-[#EFEBE3] rounded-lg" />
      </div>
      <div className="h-7 bg-[#EFEBE3] rounded-lg w-2/3 mb-3" />
      <div className="h-4 bg-[#EFEBE3] rounded-lg w-4/5" />
    </div>
  )
}
