/**
 * Demo School utilities and rules enforcement
 * Based on Class Memory Rooms Rules & Regulations
 */

export const DEMO_SCHOOL_ID = "demo"
export const DEMO_SCHOOL_NAME = "Demo High School"

/**
 * Check if a school ID is the Demo School
 */
export function isDemoSchool(schoolId: string | null | undefined): boolean {
  return schoolId === DEMO_SCHOOL_ID
}

/**
 * Get the role a user should have in Demo School
 * Rule: ALL users in Demo School are STUDENTS
 */
export function getDemoSchoolRole(): "student" {
  return "student"
}

/**
 * Check if admin actions are allowed in a school
 * Rule: No admin actions allowed in Demo School
 */
export function canPerformAdminActions(schoolId: string | null | undefined): boolean {
  return !isDemoSchool(schoolId)
}

/**
 * Get display props for Demo School badge
 */
export function getDemoSchoolBadge() {
  return {
    show: true,
    label: "Demo Mode",
    description: "Exploring the demo school",
  }
}
