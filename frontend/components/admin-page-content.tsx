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
import { Users, BookOpen, Settings, BarChart3, Copy, Check, UserPlus, Sparkles, ShieldAlert, Crown, GraduationCap, Plus, FileText, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react"
import type { Subject, Course, Chapter } from "@/types/models"
import { useToast } from "@/hooks/use-toast"
import { generateJoinKey } from "@/lib/workspace-store"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type AdminSection = "overview" | "members" | "subjects" | "ai-settings" | "school-settings"

interface Member { id: string; name: string; email: string; role: "student" | "teacher" | "admin"; joinedAt: string }
interface SubjectWithCourses extends Subject { courses: Course[] }

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
  const [joinKey, setJoinKey] = useState("")
  const [subjects, setSubjects] = useState<SubjectWithCourses[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [showCreateSubject, setShowCreateSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState("")
  const [newSubjectColor, setNewSubjectColor] = useState("#7EC8E3")
  const [creatingSubject, setCreatingSubject] = useState(false)
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState("")
  const [newCourseCode, setNewCourseCode] = useState("")
  const [newCourseTitle, setNewCourseTitle] = useState("")
  const [newCourseTeacher, setNewCourseTeacher] = useState("")
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [showCreateLecture, setShowCreateLecture] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [newLectureTitle, setNewLectureTitle] = useState("")
  const [newLectureLabel, setNewLectureLabel] = useState("")
  const [creatingLecture, setCreatingLecture] = useState(false)


  const fetchSchoolData = async () => {
    try {
      const res = await fetch(`/api/forum/schools/${schoolId}`)
      if (res.ok) {
        const data = await res.json()
        const subjectsData = data.subjects || []
        setJoinKey(data.school?.joinKey || "")
        const subjectsWithCourses: SubjectWithCourses[] = await Promise.all(
          subjectsData.map(async (subject: Subject) => {
            try {
              const coursesRes = await fetch(`/api/forum/schools/${schoolId}/subjects/${subject.id}/courses`)
              if (coursesRes.ok) {
                const coursesData = await coursesRes.json()
                return { ...subject, courses: coursesData.courses || [], courseCount: (coursesData.courses || []).length }
              }
            } catch (error) { console.error('Error fetching courses:', error) }
            return { ...subject, courses: [] }
          })
        )
        setSubjects(subjectsWithCourses)
      }
    } catch (error) { console.error('Error fetching school data:', error) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSchoolData() }, [schoolId])
  useEffect(() => {
    if (!can(activeMembership, "open_admin_dashboard")) {
      router.push(`/school/${schoolId}`)
      toast({ title: "Access Denied", description: "You are not an admin in this school.", variant: "destructive" })
    }
  }, [activeMembership, schoolId, router, toast])

  const toggleSubjectExpanded = (subjectId: string) => {
    setExpandedSubjects(prev => { const newSet = new Set(prev); newSet.has(subjectId) ? newSet.delete(subjectId) : newSet.add(subjectId); return newSet })
  }

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) { toast({ title: "Error", description: "Subject name is required", variant: "destructive" }); return }
    if (!user?.id) { toast({ title: "Error", description: "You must be logged in", variant: "destructive" }); return }
    setCreatingSubject(true)
    try {
      const res = await fetch(`/api/forum/schools/${schoolId}/subjects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSubjectName.trim(), color: newSubjectColor, userId: user.id }) })
      if (res.ok) { toast({ title: "Success", description: "Subject created successfully" }); setShowCreateSubject(false); setNewSubjectName(""); setNewSubjectColor("#7EC8E3"); await fetchSchoolData() }
      else { const error = await res.json(); toast({ title: "Error", description: error.error || "Failed to create subject", variant: "destructive" }) }
    } catch (error) { toast({ title: "Error", description: "Failed to create subject", variant: "destructive" }) }
    finally { setCreatingSubject(false) }
  }

  const handleCreateCourse = async () => {
    if (!newCourseCode.trim() || !newCourseTitle.trim()) { toast({ title: "Error", description: "Course code and title are required", variant: "destructive" }); return }
    if (!user?.id || !selectedSubjectId) { toast({ title: "Error", description: "Missing required information", variant: "destructive" }); return }
    setCreatingCourse(true)
    try {
      const res = await fetch(`/api/forum/schools/${schoolId}/subjects/${selectedSubjectId}/courses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: newCourseCode.trim(), title: newCourseTitle.trim(), teacher: newCourseTeacher.trim() || 'TBD', userId: user.id }) })
      if (res.ok) { toast({ title: "Success", description: "Course created successfully" }); setShowCreateCourse(false); setNewCourseCode(""); setNewCourseTitle(""); setNewCourseTeacher(""); setSelectedSubjectId(""); await fetchSchoolData() }
      else { const error = await res.json(); toast({ title: "Error", description: error.error || "Failed to create course", variant: "destructive" }) }
    } catch (error) { toast({ title: "Error", description: "Failed to create course", variant: "destructive" }) }
    finally { setCreatingCourse(false) }
  }

  const handleCreateLecture = async () => {
    if (!newLectureTitle.trim()) { toast({ title: "Error", description: "Lecture title is required", variant: "destructive" }); return }
    if (!user?.id || !selectedCourseId) { toast({ title: "Error", description: "Missing required information", variant: "destructive" }); return }
    setCreatingLecture(true)
    try {
      const res = await fetch(`/api/forum/courses/${selectedCourseId}/chapters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newLectureTitle.trim(), label: newLectureLabel.trim() || 'Lecture', userId: user.id }) })
      if (res.ok) { toast({ title: "Success", description: "Lecture created successfully" }); setShowCreateLecture(false); setNewLectureTitle(""); setNewLectureLabel(""); setSelectedCourseId(""); await fetchSchoolData() }
      else { const error = await res.json(); toast({ title: "Error", description: error.error || "Failed to create lecture", variant: "destructive" }) }
    } catch (error) { toast({ title: "Error", description: "Failed to create lecture", variant: "destructive" }) }
    finally { setCreatingLecture(false) }
  }

  if (!can(activeMembership, "open_admin_dashboard")) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="paper-card p-8 text-center max-w-md"><ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" /><h2 className="font-serif text-2xl font-bold text-ink mb-2">Access Denied</h2><p className="text-muted mb-4">You are not an admin in this school.</p><Button onClick={() => router.push(`/school/${schoolId}`)}>Back to School</Button></div></div>)
  }

  const totalCourses = subjects.reduce((sum, s) => sum + (s.courses?.length || 0), 0)
  const teacherCount = members.filter(m => m.role === 'teacher').length
  const studentCount = members.filter(m => m.role === 'student').length
  const handleCopyKey = () => { navigator.clipboard.writeText(joinKey); setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: "Copied!", description: "Join key copied to clipboard." }) }
  const handleRegenerateKey = () => { const newKey = generateJoinKey(); setJoinKey(newKey); toast({ title: "Key Regenerated", description: `New join key: ${newKey}` }) }
  const handleRoleChange = async (memberId: string, currentRole: string, newRole: string) => { if (currentRole === 'admin') { toast({ title: "Cannot Change Admin Role", description: "Admin roles cannot be changed.", variant: "destructive" }); return }; toast({ title: "Role Updated", description: `Member role changed to ${newRole}` }) }


  return (
    <div className="flex gap-8">
      <aside className="w-64 flex-shrink-0">
        <div className="paper-card p-4 sticky top-24">
          <nav className="space-y-1">
            <button onClick={() => setActiveSection("overview")} className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeSection === "overview" ? "bg-primary text-primary-foreground" : "text-ink hover:bg-accent/50"}`}><BarChart3 className="inline h-4 w-4 mr-2" />Overview</button>
            <button onClick={() => setActiveSection("members")} className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeSection === "members" ? "bg-primary text-primary-foreground" : "text-ink hover:bg-accent/50"}`}><Users className="inline h-4 w-4 mr-2" />Members</button>
            <button onClick={() => setActiveSection("subjects")} className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeSection === "subjects" ? "bg-primary text-primary-foreground" : "text-ink hover:bg-accent/50"}`}><BookOpen className="inline h-4 w-4 mr-2" />Subjects & Courses</button>
            <button onClick={() => setActiveSection("ai-settings")} className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeSection === "ai-settings" ? "bg-primary text-primary-foreground" : "text-ink hover:bg-accent/50"}`}><Sparkles className="inline h-4 w-4 mr-2" />AI Settings</button>
            <button onClick={() => setActiveSection("school-settings")} className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeSection === "school-settings" ? "bg-primary text-primary-foreground" : "text-ink hover:bg-accent/50"}`}><Settings className="inline h-4 w-4 mr-2" />School Settings</button>
          </nav>
        </div>
      </aside>
      <main className="flex-1">
        {activeSection === "overview" && (
          <div className="space-y-6">
            <div><h2 className="font-serif text-3xl font-bold text-ink mb-2">Overview</h2><p className="text-muted">Quick stats about your school</p></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="paper-card p-6 text-center"><div className="text-3xl font-bold text-ink mb-1">{members.length}</div><div className="text-sm text-muted">Total Members</div></div>
              <div className="paper-card p-6 text-center"><div className="text-3xl font-bold text-ink mb-1">{teacherCount}</div><div className="text-sm text-muted">Teachers</div></div>
              <div className="paper-card p-6 text-center"><div className="text-3xl font-bold text-ink mb-1">{studentCount}</div><div className="text-sm text-muted">Students</div></div>
              <div className="paper-card p-6 text-center"><div className="text-3xl font-bold text-ink mb-1">{subjects.length}</div><div className="text-sm text-muted">Subjects</div></div>
              <div className="paper-card p-6 text-center"><div className="text-3xl font-bold text-ink mb-1">{totalCourses}</div><div className="text-sm text-muted">Courses</div></div>
              <div className="paper-card p-6 text-center"><div className="text-3xl font-bold text-ink mb-1">{chapters.length}</div><div className="text-sm text-muted">Lectures</div></div>
            </div>
          </div>
        )}
        {activeSection === "members" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between"><div><h2 className="font-serif text-3xl font-bold text-ink mb-2">Members</h2><p className="text-muted">Manage school members and roles</p></div><Button onClick={() => setShowInvite(!showInvite)}><UserPlus className="mr-2 h-4 w-4" />Invite Member</Button></div>
            {showInvite && (<div className="paper-card p-6 border-2 border-primary"><h3 className="font-serif text-lg font-bold text-ink mb-2">School Join Key</h3><p className="text-sm text-muted mb-4">Share this key with new members to join your school</p><div className="flex gap-2"><Input value={joinKey} readOnly className="font-mono text-lg" /><Button onClick={handleCopyKey} variant="outline" size="icon">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button></div></div>)}
            {members.length === 0 ? (<div className="paper-card p-12 text-center"><Users className="h-12 w-12 text-muted mx-auto mb-4" /><h3 className="font-serif text-xl font-bold text-ink mb-2">No Members Yet</h3><p className="text-muted mb-4">Share your join key to invite members to your school.</p><Button onClick={() => setShowInvite(true)}><UserPlus className="mr-2 h-4 w-4" />Get Join Key</Button></div>) : (
              <div className="paper-card divide-y divide-border">{members.map((member) => (<div key={member.id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="font-medium text-ink">{member.name}</span>{member.role === "admin" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"><Crown className="h-3 w-3" />Admin</span>}{member.role === "teacher" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"><GraduationCap className="h-3 w-3" />Teacher</span>}{member.role === "student" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-700 border border-lime-200">Student</span>}</div><div className="text-sm text-muted">{member.email}</div></div><div className="flex gap-2">{member.role !== "admin" && (<>{member.role === "student" && <Button variant="outline" size="sm" onClick={() => handleRoleChange(member.id, member.role, "teacher")}>Make Teacher</Button>}{member.role === "teacher" && <Button variant="outline" size="sm" onClick={() => handleRoleChange(member.id, member.role, "student")}>Make Student</Button>}<Button variant="outline" size="sm" onClick={() => handleRoleChange(member.id, member.role, "admin")}>Promote to Admin</Button></>)}{member.role === "admin" && member.id !== user?.id && <span className="text-sm text-muted italic">Admin roles cannot be changed</span>}</div></div>))}</div>
            )}
          </div>
        )}

        {activeSection === "subjects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between"><div><h2 className="font-serif text-3xl font-bold text-ink mb-2">Subjects & Courses</h2><p className="text-muted">Create and manage subjects, courses, and lectures</p></div>
              <Dialog open={showCreateSubject} onOpenChange={setShowCreateSubject}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create Subject</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create New Subject</DialogTitle><DialogDescription>Add a new subject to your school.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="subject-name">Subject Name</Label><Input id="subject-name" placeholder="e.g., Mathematics, Physics" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="subject-color">Color</Label><div className="flex gap-2"><Input id="subject-color" type="color" value={newSubjectColor} onChange={(e) => setNewSubjectColor(e.target.value)} className="w-16 h-10 p-1" /><Input value={newSubjectColor} onChange={(e) => setNewSubjectColor(e.target.value)} placeholder="#7EC8E3" className="flex-1" /></div></div></div><DialogFooter><Button variant="outline" onClick={() => setShowCreateSubject(false)}>Cancel</Button><Button onClick={handleCreateSubject} disabled={creatingSubject}>{creatingSubject ? "Creating..." : "Create Subject"}</Button></DialogFooter></DialogContent></Dialog>
            </div>
            <div className="space-y-4">
              {loading ? (<div className="paper-card p-12 text-center"><p className="text-muted">Loading subjects...</p></div>) : subjects.length === 0 ? (<div className="paper-card p-12 text-center"><BookOpen className="h-12 w-12 text-muted mx-auto mb-4" /><h3 className="font-serif text-xl font-bold text-ink mb-2">No Subjects Yet</h3><p className="text-muted mb-4">Create your first subject to get started.</p><Button onClick={() => setShowCreateSubject(true)}><Plus className="mr-2 h-4 w-4" />Create Subject</Button></div>) : (
                subjects.map((subject) => (
                  <div key={subject.id} className="paper-card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <button onClick={() => toggleSubjectExpanded(subject.id)} className="flex items-center gap-3 hover:opacity-80">{expandedSubjects.has(subject.id) ? <ChevronDown className="h-5 w-5 text-muted" /> : <ChevronRight className="h-5 w-5 text-muted" />}<div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: subject.colorTag }} /><h3 className="font-serif text-xl font-bold text-ink">{subject.name}</h3></button>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedSubjectId(subject.id); setShowCreateCourse(true) }}><Plus className="mr-2 h-4 w-4" />Add Course</Button>
                      </div>
                      <div className="text-sm text-muted ml-12">{subject.courses?.length || 0} courses • {subject.chapterCount} lectures</div>
                    </div>
                    {expandedSubjects.has(subject.id) && subject.courses && subject.courses.length > 0 && (
                      <div className="border-t border-border bg-accent/20">{subject.courses.map((course) => (<div key={course.id} className="p-4 pl-12 flex items-center justify-between border-b border-border last:border-b-0"><div><div className="font-medium text-ink">{course.code}: {course.title}</div><div className="text-sm text-muted">Teacher: {course.teacher}</div></div><Button variant="ghost" size="sm" onClick={() => { setSelectedCourseId(course.id); setShowCreateLecture(true) }}><FileText className="mr-2 h-4 w-4" />Add Lecture</Button></div>))}</div>
                    )}
                    {expandedSubjects.has(subject.id) && (!subject.courses || subject.courses.length === 0) && (<div className="border-t border-border bg-accent/20 p-6 text-center"><p className="text-sm text-muted">No courses yet. Add a course to get started.</p></div>)}
                  </div>
                ))
              )}
            </div>
            <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}><DialogContent><DialogHeader><DialogTitle>Create New Course</DialogTitle><DialogDescription>Add a new course to the selected subject.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="course-code">Course Code</Label><Input id="course-code" placeholder="e.g., MATH101" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="course-title">Course Title</Label><Input id="course-title" placeholder="e.g., Introduction to Calculus" value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="course-teacher">Teacher (optional)</Label><Input id="course-teacher" placeholder="e.g., Dr. Smith" value={newCourseTeacher} onChange={(e) => setNewCourseTeacher(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setShowCreateCourse(false)}>Cancel</Button><Button onClick={handleCreateCourse} disabled={creatingCourse}>{creatingCourse ? "Creating..." : "Create Course"}</Button></DialogFooter></DialogContent></Dialog>
            <Dialog open={showCreateLecture} onOpenChange={setShowCreateLecture}><DialogContent><DialogHeader><DialogTitle>Create New Lecture</DialogTitle><DialogDescription>Add a new lecture to the selected course.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="lecture-title">Lecture Title</Label><Input id="lecture-title" placeholder="e.g., Introduction to Derivatives" value={newLectureTitle} onChange={(e) => setNewLectureTitle(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="lecture-label">Label (optional)</Label><Input id="lecture-label" placeholder="e.g., Week 1, Chapter 1" value={newLectureLabel} onChange={(e) => setNewLectureLabel(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setShowCreateLecture(false)}>Cancel</Button><Button onClick={handleCreateLecture} disabled={creatingLecture}>{creatingLecture ? "Creating..." : "Create Lecture"}</Button></DialogFooter></DialogContent></Dialog>
          </div>
        )}

        {activeSection === "ai-settings" && (
          <div className="space-y-6">
            <div><h2 className="font-serif text-3xl font-bold text-ink mb-2">AI Settings</h2><p className="text-muted">Configure AI note generation requirements</p></div>
            <div className="paper-card p-6 space-y-8">
              <div><Label className="text-base font-medium text-ink mb-4 block">Minimum Contributions to Unlock AI</Label><p className="text-sm text-muted mb-4">How many contributions must a chapter have before AI notes can be generated?</p><div className="flex items-center gap-4"><Slider value={[minContributions]} onValueChange={(vals) => setMinContributions(vals[0])} min={5} max={30} step={1} className="flex-1" /><div className="w-16 text-right"><span className="text-2xl font-bold text-ink">{minContributions}</span></div></div></div>
              <div className="border-t border-border pt-8"><Label className="text-base font-medium text-ink mb-4 block">Student Cooldown Duration (hours)</Label><p className="text-sm text-muted mb-4">How long must students wait between AI note generations?</p><div className="flex items-center gap-4"><Slider value={[studentCooldown]} onValueChange={(vals) => setStudentCooldown(vals[0])} min={1} max={24} step={0.5} className="flex-1" /><div className="w-16 text-right"><span className="text-2xl font-bold text-ink">{studentCooldown}</span></div></div><div className="mt-4 text-sm text-muted">Teachers: 30 minutes • Admins: No cooldown</div></div>
              <div className="border-t border-border pt-8"><Button onClick={() => toast({ title: "Settings saved", description: "AI settings updated successfully." })}>Save AI Settings</Button></div>
            </div>
          </div>
        )}
        {activeSection === "school-settings" && (
          <div className="space-y-6">
            <div><h2 className="font-serif text-3xl font-bold text-ink mb-2">School Settings</h2><p className="text-muted">Manage school configuration and security</p></div>
            <div className="paper-card p-6 space-y-6">
              <div><Label className="text-base font-medium text-ink mb-4 block">Join Key</Label><p className="text-sm text-muted mb-4">Current join key for your school. Regenerate if compromised.</p><div className="flex gap-2 mb-4"><Input value={joinKey} readOnly className="font-mono text-lg" /><Button onClick={handleCopyKey} variant="outline" size="icon">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button></div><Button onClick={handleRegenerateKey} variant="outline">Regenerate Join Key</Button></div>
              <div className="border-t border-border pt-6"><Label className="text-base font-medium text-destructive mb-2 flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Danger Zone</Label><p className="text-sm text-muted mb-4">Permanently delete this school and all its data. This action cannot be undone.</p><Button variant="destructive" disabled>Delete School (Coming Soon)</Button></div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
