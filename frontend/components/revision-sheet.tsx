import { Check } from "lucide-react"

interface RevisionSheetProps {
  items: string[]
}

export function RevisionSheet({ items }: RevisionSheetProps) {
  return (
    <div className="bg-ai-highlight/10 border-2 border-ai-highlight rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="font-serif text-xl font-bold text-ink">Last-Minute Study Guide</h3>
        <p className="text-sm text-muted mt-1">Essential points to review before your exam</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-3 items-start bg-card rounded-lg p-3">
            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-ink leading-relaxed text-sm">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
