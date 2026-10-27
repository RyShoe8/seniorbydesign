import "next-auth";
declare module "next-auth" {
  interface User {
    role?: string;
    portalAccess?: boolean;
    sessionVersion?: number;
  }
  interface Session {
    user?: {
      id: string;
      email?: string | null;
      role?: string | null;
      portalAccess?: boolean;
      sessionVersion: number;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    portalAccess?: boolean;
    sessionVersion?: number;
  }
}
