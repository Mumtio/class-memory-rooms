import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface GatewayCardProps {
  icon: LucideIcon
  title: string
  description: string
  buttonText: string
  buttonHref: string
  variant?: "primary" | "secondary"
}

export function GatewayCard({
  icon: Icon,
  title,
  description,
  buttonText,
  buttonHref,
  variant = "primary",
}: GatewayCardProps) {
  return (
    <div className="paper-card p-8 md:p-10 sketch-shadow hover:shadow-lg transition-all group">
      <div className="mb-6 inline-flex p-4 bg-primary/20 rounded-2xl">
        <Icon className="h-8 w-8 text-ink" />
      </div>

      <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink mb-3">{title}</h2>
      <p className="text-muted leading-relaxed mb-6">{description}</p>

      {variant === "primary" ? (
        <Button size="lg" className="w-full" asChild>
          <Link href={buttonHref}>{buttonText}</Link>
        </Button>
      ) : (
        <Button size="lg" variant="outline" className="w-full bg-transparent" asChild>
          <Link href={buttonHref}>{buttonText}</Link>
        </Button>
      )}
    </div>
  )
}
