export function isStaffRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "RECEPTIONIST" || role === "TECHNICIAN";
}
