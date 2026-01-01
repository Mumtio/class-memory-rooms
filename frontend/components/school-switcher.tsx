"use client"

import { useActiveSchool } from "@/lib/active-school-context"
import { useAuth } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Building2, Check, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function SchoolSwitcher() {
  const { user } = useAuth()
  const { activeSchoolId, activeMembership, setActiveSchool, getUserMemberships } = useActiveSchool()
  const router = useRouter()

  const memberships = getUserMemberships(user)

  if (memberships.length === 0) {
    return (
      <Button asChild variant="ghost" className="gap-2 border border-muted-foreground/20 bg-card/50 hover:bg-card">
        <Link href="/gateway/create">
          <Plus className="h-4 w-4" />
          <span>Create School</span>
        </Link>
      </Button>
    )
  }

  const handleSchoolChange = (schoolId: string) => {
    setActiveSchool(schoolId)
    router.push(`/school/${schoolId}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 border border-muted-foreground/20 bg-card/50 hover:bg-card">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{activeMembership?.schoolName || "Select School"}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Your Schools ({memberships.length})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => {
          const isActive = membership.schoolId === activeSchoolId
          const roleColors = {
            admin: "bg-red-100 text-red-700 border-red-300",
            teacher: "bg-blue-100 text-blue-700 border-blue-300",
            student: "bg-lime-100 text-lime-700 border-lime-300",
          }

          return (
            <DropdownMenuItem
              key={membership.schoolId}
              onClick={() => handleSchoolChange(membership.schoolId)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="font-medium truncate">{membership.schoolName}</div>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit ${roleColors[membership.role]}`}
                >
                  {membership.role.charAt(0).toUpperCase() + membership.role.slice(1)}
                </span>
              </div>
              {isActive && <Check className="h-4 w-4 text-lime-600 flex-shrink-0" />}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/gateway/create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create New School</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
