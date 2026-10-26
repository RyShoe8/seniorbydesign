import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/admin/login" || path.startsWith("/account"))
    return NextResponse.next();
  const token = await getToken({ req });
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    const staff = token && ["admin", "team"].includes(String(token.role));
    if (!staff)
      return path.startsWith("/api/")
        ? NextResponse.json(
            { error: "SBD staff access required" },
            { status: token ? 403 : 401 },
          )
        : NextResponse.redirect(new URL("/account/login?staff=1", req.url));
    if (
      (path.startsWith("/admin/users") ||
        path.startsWith("/api/admin/users")) &&
      token.role !== "admin"
    )
      return path.startsWith("/api/")
        ? NextResponse.json(
            { error: "Administrator required" },
            { status: 403 },
          )
        : NextResponse.redirect(new URL("/admin", req.url));
  }
  if (path.startsWith("/portal") && !token)
    return NextResponse.redirect(new URL("/account/login", req.url));
  if (req.nextUrl.hostname === "clients.seniorbydesign.com" && path === "/")
    return NextResponse.redirect(new URL("/portal", req.url));
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/api/admin/:path*",
    "/portal/:path*",
    "/account/:path*",
  ],
};
