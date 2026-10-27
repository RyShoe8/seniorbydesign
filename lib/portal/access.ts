// Temporary private testing access; independent of general SBD admin permissions.
export function canAccessPortalPreview(user: { email?: string | null; role?: unknown } | null | undefined) {
  return user?.role === "admin" && user.email?.trim().toLowerCase() === "ryanschumacher@themediashop.co";
}
