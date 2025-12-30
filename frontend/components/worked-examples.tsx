interface Example {
  title: string
  steps: string[]
  answer: string
}

interface WorkedExamplesProps {
  examples: Example[]
}

export function WorkedExamples({ examples }: WorkedExamplesProps) {
  return (
    <div className="space-y-6">
      {examples.map((example, index) => (
        <div key={index} className="paper-card p-6 bg-card">
          <h3 className="font-serif text-xl font-bold text-ink mb-4">{example.title}</h3>
          <ol className="space-y-3 mb-4">
            {example.steps.map((step, stepIndex) => (
              <li key={stepIndex} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-ink">
                  {stepIndex + 1}
                </span>
                <span className="text-ink leading-relaxed flex-1">{step}</span>
              </li>
            ))}
          </ol>
          <div className="bg-ai-highlight/20 border-2 border-ai-highlight rounded-lg p-4 mt-4">
            <span className="font-semibold text-ink">Final Answer: </span>
            <span className="text-ink">{example.answer}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
