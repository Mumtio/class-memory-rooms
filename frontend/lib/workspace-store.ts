export interface School {
  id: string
  name: string
  description: string
  joinKey: string
  createdBy: string
  createdAt: string
}

const STORAGE_KEY = "class-memory-workspaces"

function getWorkspaces(): School[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveWorkspaces(schools: School[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schools))
  } catch (error) {
    console.error("Failed to save workspaces:", error)
  }
}

export function generateJoinKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let key = ""
  for (let i = 0; i < 6; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export function createWorkspace(name: string, description: string, userId: string): School {
  const workspaces = getWorkspaces()
  const schoolId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  const newSchool: School = {
    id: schoolId,
    name,
    description,
    joinKey: generateJoinKey(),
    createdBy: userId,
    createdAt: new Date().toISOString(),
  }

  workspaces.push(newSchool)
  saveWorkspaces(workspaces)

  return newSchool
}

export function findSchoolByKey(joinKey: string): School | null {
  const workspaces = getWorkspaces()
  return workspaces.find((s) => s.joinKey === joinKey.toUpperCase()) || null
}
