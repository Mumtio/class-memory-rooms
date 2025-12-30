import type { UserRole } from "@/lib/auth-store"
import type { Membership } from "@/lib/active-school-context"
import { isDemoSchool } from "@/lib/demo-school"

// Permission action types
export type PermissionAction =
  | "generate_ai_notes"
  | "open_admin_dashboard"
  | "create_subject"
  | "create_course"
  | "manage_members"
  | "change_ai_settings"
  | "regenerate_join_key"
  | "delete_school"
  | "promote_members"
  | "remove_members"

// Permission matrix: role -> actions allowed
const PERMISSION_MATRIX: Record<UserRole, PermissionAction[]> = {
  student: ["generate_ai_notes"],
  teacher: ["generate_ai_notes", "create_subject", "create_course"],
  admin: [
    "generate_ai_notes",
    "create_subject",
    "create_course",
    "open_admin_dashboard",
    "manage_members",
    "change_ai_settings",
    "regenerate_join_key",
    "promote_members",
    "remove_members",
    "delete_school",
  ],
}

/**
 * Check if a user with a given role can perform an action
 * @param membership - The user's membership in a school (contains role)
 * @param action - The action to check permission for
 * @returns true if the user can perform the action
 */
export function can(membership: Membership | null, action: PermissionAction): boolean {
  if (!membership) return false

  const adminActions: PermissionAction[] = [
    "open_admin_dashboard",
    "create_subject",
    "create_course",
    "manage_members",
    "change_ai_settings",
    "regenerate_join_key",
    "promote_members",
    "remove_members",
    "delete_school",
  ]

  if (isDemoSchool(membership.schoolId) && adminActions.includes(action)) {
    return false
  }

  return PERMISSION_MATRIX[membership.role]?.includes(action) ?? false
}

/**
 * Check if a role can perform an action (without membership object)
 * Useful for quick checks when you already have the role
 */
export function roleHasPermission(role: UserRole, action: PermissionAction): boolean {
  return PERMISSION_MATRIX[role]?.includes(action) ?? false
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): PermissionAction[] {
  return PERMISSION_MATRIX[role] ?? []
}
