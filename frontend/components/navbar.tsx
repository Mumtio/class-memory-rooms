"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DemoModeBadge } from "@/components/demo-mode-badge"
import { useAuth } from "@/lib/auth-store"
import { can } from "@/lib/permissions"
import { SchoolSwitcher } from "@/components/school-switcher"
import { LogOut, User, Shield } from "lucide-react"
import { isDemoSchool } from "@/lib/demo-school"
import { useContext } from "react"
import { ActiveSchoolContext } from "@/lib/active-school-context"

export function Navbar() {
  const pathname = usePathname()
  const { user, isAuthenticated, signOut } = useAuth()
  
  // Use context directly and handle case where it's not available
  const activeSchoolContext = useContext(ActiveSchoolContext)
  const activeMembership = activeSchoolContext?.activeMembership || null

  const isActive = (path: string) => {
    if (path === "/school" || path === "/gateway") {
      return pathname.startsWith("/school") || pathname.startsWith("/course") || pathname.startsWith("/chapter")
    }
    return pathname.startsWith(path)
  }

  const roomsLink = isAuthenticated && user ? `/school/${user.currentSchoolId || "demo"}` : "/signup"

  const getRoleBadge = () => {
    if (!activeMembership) return null

    const roleConfig = {
      admin: { label: "Admin", bg: "bg-red-500", text: "text-white" },
      teacher: { label: "Teacher", bg: "bg-blue-500", text: "text-white" },
      student: { label: "Student", bg: "bg-primary", text: "text-ink" },
    }

    const config = roleConfig[activeMembership.role]
    return (
      <span
        className={`text-xs ${config.bg} ${config.text} px-2 py-0.5 rounded-full font-semibold`}
        title="Your role in this school"
      >
        {config.label}
      </span>
    )
  }

  const isAdmin = can(activeMembership, "open_admin_dashboard") && !isDemoSchool(activeMembership?.schoolId)

  return (
    <nav className="border-b-2 border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
            aria-label="Memory Rooms home"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-ink font-serif font-bold text-lg">M</span>
            </div>
            <span className="font-serif font-bold text-xl text-ink">Memory Rooms</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href={roomsLink}
              className={cn(
                "text-ink hover:text-ink transition-colors relative py-1 focus:outline-none focus:ring-2 focus:ring-primary rounded",
                isActive("/school") &&
                  "font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full after:transition-all",
              )}
              aria-current={isActive("/school") ? "page" : undefined}
            >
              Rooms
            </Link>
            {isAuthenticated && isAdmin && activeMembership && (
              <Link
                href={`/school/${activeMembership.schoolId}/admin`}
                className={cn(
                  "text-ink hover:text-ink transition-colors relative py-1 focus:outline-none focus:ring-2 focus:ring-primary rounded flex items-center gap-1",
                  isActive("/admin") &&
                    "font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-red-500 after:rounded-full after:transition-all",
                )}
                aria-current={isActive("/admin") ? "page" : undefined}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <DemoModeBadge />
            {isAuthenticated && user ? (
              <>
                {activeSchoolContext && <SchoolSwitcher />}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                  <User className="h-4 w-4 text-ink" />
                  <span className="text-sm font-semibold text-ink">{user.name}</span>
                  {getRoleBadge()}
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
