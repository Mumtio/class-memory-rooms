import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ErrorCardProps {
  title: string
  description: string
  backLink?: {
    label: string
    href: string
  }
}

export function ErrorCard({ title, description, backLink }: ErrorCardProps) {
  return (
    <div className="paper-card p-12 max-w-2xl mx-auto text-center">
      <div className="mb-6 flex justify-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
      </div>
      <h2 className="font-serif text-3xl font-bold text-ink mb-3">{title}</h2>
      <p className="text-muted text-lg mb-8">{description}</p>
      {backLink && (
        <Button asChild variant="outline">
          <Link href={backLink.href}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLink.label}
          </Link>
        </Button>
      )}
    </div>
  )
}
