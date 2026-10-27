// Staff access is granted separately from website administration.
export function canAccessPortalPreview(user: { email?: string | null; role?: unknown; portalAccess?: boolean; memberships?: { active: boolean }[] } | null | undefined) {
  if (!user) return false;
  if (user.role === "admin" || user.role === "team")
    return user.portalAccess === true || (user.portalAccess === undefined && user.email?.trim().toLowerCase() === "ryanschumacher@themediashop.co");
  return !!user.memberships?.some(m => m.active);
}
