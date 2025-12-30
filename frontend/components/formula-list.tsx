interface Formula {
  formula: string
  meaning: string
  note?: string
}

interface FormulaListProps {
  formulas: Formula[]
}

export function FormulaList({ formulas }: FormulaListProps) {
  return (
    <div className="space-y-4">
      {formulas.map((formula, index) => (
        <div key={index} className="bg-card border-l-4 border-primary p-5 rounded-lg">
          <div className="font-mono text-lg text-ink mb-2 bg-muted/30 px-4 py-2 rounded-lg inline-block">
            {formula.formula}
          </div>
          <p className="text-ink leading-relaxed mb-1">{formula.meaning}</p>
          {formula.note && <p className="text-sm text-muted italic">Note: {formula.note}</p>}
        </div>
      ))}
    </div>
  )
}
