interface Definition {
  term: string
  meaning: string
}

interface DefinitionCardsProps {
  definitions: Definition[]
}

export function DefinitionCards({ definitions }: DefinitionCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {definitions.map((def, index) => (
        <div
          key={index}
          className="bg-card border-2 border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <dt className="font-semibold text-ink text-lg mb-2">{def.term}</dt>
          <dd className="text-muted leading-relaxed">{def.meaning}</dd>
        </div>
      ))}
    </div>
  )
}
