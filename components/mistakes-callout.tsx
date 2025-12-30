import { AlertTriangle } from "lucide-react"

interface MistakesCalloutProps {
  mistakes: string[]
}

export function MistakesCallout({ mistakes }: MistakesCalloutProps) {
  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-6 w-6 text-orange-600" />
        <h3 className="font-serif text-xl font-bold text-orange-900">Watch Out For These!</h3>
      </div>
      <ul className="space-y-3">
        {mistakes.map((mistake, index) => (
          <li key={index} className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-300 rounded-full flex items-center justify-center text-sm font-bold text-orange-900">
              ×
            </span>
            <span className="text-orange-900 leading-relaxed">{mistake}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
