"use client"

import { useAuth } from "@/lib/auth-store"
import { useActiveSchool } from "@/lib/active-school-context"
import { can } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Users,
  BookOpen,
  Settings,
  BarChart3,
  Copy,
  Check,
  UserPlus,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Crown,
  GraduationCap,
} from "lucide-react"
import type { Subject, Course, Chapter } from "@/types/models"
import { useToast } from "@/hooks/use-toast"
import { generateJoinKey } from "@/lib/workspace-store"
import { isDemoSchool } from "@/lib/demo-school"

type AdminSection = "overview" | "members" | "subjects" | "ai-settings" | "school-settings"

interface MockMember {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
  joinedAt: string
}

const MOCK_MEMBERS: MockMember[] = [
  { id: "1", name: "Emma Wilson", email: "emma@demo.edu", role: "admin", joinedAt: "2024-08-15" },
  { id: "2", name: "Liam Chen", email: "liam@demo.edu", role: "teacher", joinedAt: "2024-08-20" },
  { id: "3", name: "Sophia Rodriguez", email: "sophia@demo.edu", role: "student", joinedAt: "2024-09-01" },
  { id: "4", name: "Noah Patel", email: "noah@demo.edu", role: "student", joinedAt: "2024-09-02" },
  { id: "5", name: "Olivia Johnson", email: "olivia@demo.edu", role: "student", joinedAt: "2024-09-03" },
]

export function AdminPageContent({ schoolId }: { schoolId: string }) {
  const { user } = useAuth()
  const { activeMembership } = useActiveSchool()
  const router = useRouter()
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState<AdminSection>("overview")
  const [copied, setCopied] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [minContributions, setMinContributions] = useState(15)
  const [studentCooldown, setStudentCooldown] = useState(2)
  const [joinKey, setJoinKey] = useState("DEMO2024")
  
  // Data state - will be fetched from API
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchoolData() {
      try {
        const res = await fetch(`/api/forum/schools/${schoolId}`)
        if (res.ok) {
          const data = await res.json()
          setSubjects(data.subjects || [])
        }
      } catch (error) {
        console.error('Error fetching school data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSchoolData()
  }, [schoolId])

  useEffect(() => {
    if (isDemoSchool(schoolId)) {
      router.push(`/school/${schoolId}`)
      toast({
        title: "Admin Not Available",
        description: "The Demo School does not have admin features.",
        variant: "destructive",
      })
      return
    }

    if (!can(activeMembership, "open_admin_dashboard")) {
      router.push(`/school/${schoolId}`)
      toast({
        title: "Access Denied",
        description: "You are not an admin in this school.",
        variant: "destructive",
      })
    }
  }, [activeMembership, schoolId, router, toast])

  if (isDemoSchool(schoolId)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="paper-card p-8 text-center max-w-md">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Not Available</h2>
          <p className="text-muted mb-4">
            The Demo School does not have admin features. Create your own school to access the admin dashboard.
          </p>
          <Button onClick={() => router.push(`/school/${schoolId}`)}>Back to School</Button>
        </div>
      </div>
    )
  }

  if (!can(activeMembership, "open_admin_dashboard")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="paper-card p-8 text-center max-w-md">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-ink mb-2">Access Denied</h2>
          <p className="text-muted mb-4">You are not an admin in this school.</p>
          <Button onClick={() => router.push(`/school/${schoolId}`)}>Back to School</Button>
        </div>
      </div>
    )
  }

  const totalContributions = chapters.reduce((sum, ch) => sum + ch.contributions, 0)

  const handleCopyKey = () => {
    navigator.clipboard.writeText(joinKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copied!", description: "Join key copied to clipboard." })
  }

  const handleRegenerateKey = () => {
    const newKey = generateJoinKey()
    setJoinKey(newKey)
    toast({ title: "Key Regenerated", description: `New join key: ${newKey}` })
  }

  return (
    <div className="flex gap-8">
      <aside className="w-64 flex-shrink-0">
        <div className="paper-card p-4 sticky top-24">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection("overview")}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                activeSection === "overview" ? "bg-primary text-primary-foreground" : "text-ink hover:bg-accent/50"
              }`}
            >
              <BarChart3 className="inline h-4 w-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveSection("members")}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                activeSection === "members" ? "bg-primary text-primary-foreground" : "text-ink hover:bg-accent/50"
              }`}
            >
              <Users className="inline h-4 w-4 mr-2" />
              Members
            </button>
            <button
              onClick={() => setActiveSection("subjects")}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                activeSection === "subjects" ? "bg-primary text-primary-foreground" : "text-ink hover:bg-accent/50"
              }`}
            >
              <BookOpen className="inline h-4 w-4 mr-2" />
              Subjects & Courses
            </button>
            <button
              onClick={() => setActiveSection("ai-settings")}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                activeSection === "ai-settings" ? "bg-primary text-primary-foreground" : "text-ink hover:bg-accent/50"
              }`}
            >
              <Sparkles className="inline h-4 w-4 mr-2" />
              AI Settings
            </button>
            <button
              onClick={() => setActiveSection("school-settings")}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                activeSection === "school-settings"
                  ? "bg-primary text-primary-foreground"
                  : "text-ink hover:bg-accent/50"
              }`}
            >
              <Settings className="inline h-4 w-4 mr-2" />
              School Settings
            </button>
          </nav>
        </div>
      </aside>

      <main className="flex-1">
        {activeSection === "overview" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold text-ink mb-2">Overview</h2>
              <p className="text-muted">Quick stats about your school</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="paper-card p-6 text-center">
                <div className="text-3xl font-bold text-ink mb-1">{MOCK_MEMBERS.length}</div>
                <div className="text-sm text-muted">Members</div>
              </div>
              <div className="paper-card p-6 text-center">
                <div className="text-3xl font-bold text-ink mb-1">{subjects.length}</div>
                <div className="text-sm text-muted">Subjects</div>
              </div>
              <div className="paper-card p-6 text-center">
                <div className="text-3xl font-bold text-ink mb-1">{courses.length}</div>
                <div className="text-sm text-muted">Courses</div>
              </div>
              <div className="paper-card p-6 text-center">
                <div className="text-3xl font-bold text-ink mb-1">{chapters.length}</div>
                <div className="text-sm text-muted">Chapters</div>
              </div>
              <div className="paper-card p-6 text-center">
                <div className="text-3xl font-bold text-ink mb-1">{totalContributions}</div>
                <div className="text-sm text-muted">Total Contributions</div>
              </div>
              <div className="paper-card p-6 text-center">
                <div className="text-3xl font-bold text-ink mb-1">
                  {chapters.filter((ch) => ch.status === "Compiled").length}
                </div>
                <div className="text-sm text-muted">Compiled Notes</div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "members" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl font-bold text-ink mb-2">Members</h2>
                <p className="text-muted">Manage school members and roles</p>
              </div>
              <Button onClick={() => setShowInvite(!showInvite)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </div>

            {showInvite && (
              <div className="paper-card p-6 border-2 border-primary">
                <h3 className="font-serif text-lg font-bold text-ink mb-2">School Join Key</h3>
                <p className="text-sm text-muted mb-4">Share this key with new members to join your school</p>
                <div className="flex gap-2">
                  <Input value={joinKey} readOnly className="font-mono text-lg" />
                  <Button onClick={handleCopyKey} variant="outline" size="icon">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="paper-card divide-y divide-border">
              {MOCK_MEMBERS.map((member) => (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-ink">{member.name}</span>
                      {member.role === "admin" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          <Crown className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                      {member.role === "teacher" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                          <GraduationCap className="h-3 w-3" />
                          Teacher
                        </span>
                      )}
                      {member.role === "student" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-700 border border-lime-200">
                          Student
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted">{member.email}</div>
                  </div>
                  <div className="flex gap-2">
                    {member.role !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast({ title: "Demo", description: "Role promotion in demo mode." })}
                      >
                        Promote to Admin
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => toast({ title: "Demo", description: "Member removal in demo mode." })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "subjects" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold text-ink mb-2">Subjects & Courses</h2>
              <p className="text-muted">Create and manage subjects and courses</p>
            </div>

            <div className="space-y-4">
              <Button>Create New Subject</Button>

              {subjects.map((subject) => (
                <div key={subject.id} className="paper-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject.colorTag }}
                      />
                      <h3 className="font-serif text-xl font-bold text-ink">{subject.name}</h3>
                    </div>
                    <Button variant="outline" size="sm">
                      Create Course
                    </Button>
                  </div>
                  <div className="text-sm text-muted">
                    {subject.courseCount} courses • {subject.chapterCount} chapters
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "ai-settings" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold text-ink mb-2">AI Settings</h2>
              <p className="text-muted">Configure AI note generation requirements</p>
            </div>

            <div className="paper-card p-6 space-y-8">
              <div>
                <Label className="text-base font-medium text-ink mb-4 block">Minimum Contributions to Unlock AI</Label>
                <p className="text-sm text-muted mb-4">
                  How many contributions must a chapter have before AI notes can be generated?
                </p>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[minContributions]}
                    onValueChange={(vals) => setMinContributions(vals[0])}
                    min={5}
                    max={30}
                    step={1}
                    className="flex-1"
                  />
                  <div className="w-16 text-right">
                    <span className="text-2xl font-bold text-ink">{minContributions}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-8">
                <Label className="text-base font-medium text-ink mb-4 block">Student Cooldown Duration (hours)</Label>
                <p className="text-sm text-muted mb-4">How long must students wait between AI note generations?</p>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[studentCooldown]}
                    onValueChange={(vals) => setStudentCooldown(vals[0])}
                    min={1}
                    max={24}
                    step={0.5}
                    className="flex-1"
                  />
                  <div className="w-16 text-right">
                    <span className="text-2xl font-bold text-ink">{studentCooldown}</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted">Teachers: 30 minutes • Admins: No cooldown</div>
              </div>

              <div className="border-t border-border pt-8">
                <Button
                  onClick={() => toast({ title: "Settings saved", description: "AI settings updated successfully." })}
                >
                  Save AI Settings
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "school-settings" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold text-ink mb-2">School Settings</h2>
              <p className="text-muted">Manage school configuration and security</p>
            </div>

            <div className="paper-card p-6 space-y-6">
              <div>
                <Label className="text-base font-medium text-ink mb-4 block">Join Key</Label>
                <p className="text-sm text-muted mb-4">Current join key for your school. Regenerate if compromised.</p>
                <div className="flex gap-2 mb-4">
                  <Input value={joinKey} readOnly className="font-mono text-lg" />
                  <Button onClick={handleCopyKey} variant="outline" size="icon">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleRegenerateKey} variant="outline">
                  Regenerate Join Key
                </Button>
              </div>

              <div className="border-t border-border pt-6">
                <Label className="text-base font-medium text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </Label>
                <p className="text-sm text-muted mb-4">
                  Permanently delete this school and all its data. This action cannot be undone.
                </p>
                <Button variant="destructive" disabled>
                  Delete School (Disabled in Demo)
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
