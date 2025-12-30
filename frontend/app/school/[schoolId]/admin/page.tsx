import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AdminPageContent } from "@/components/admin-page-content"

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ schoolId: string }>
}) {
  const { schoolId } = await params

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/school/${schoolId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to School
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-ink mb-2">Admin Dashboard</h1>
          <p className="text-muted">Manage your school, members, and settings</p>
        </div>

        <AdminPageContent schoolId={schoolId} />
      </main>
    </div>
  )
}
