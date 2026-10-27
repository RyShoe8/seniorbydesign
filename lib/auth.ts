import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUsersCollection } from "./db";
import bcrypt from "bcryptjs";
import { emailKey, staffRole } from "./portal/policy";
import { rateLimit } from "./portal/rate-limit";
import { verifyStaffSignIn } from "./staff-signin";
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'staff-email',
      name: 'Staff email link or code',
      credentials: { email: { type: 'email' }, code: { type: 'text' }, token: { type: 'text' } },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        try { return await verifyStaffSignIn(emailKey(credentials.email), credentials.code, credentials.token); }
        catch { return null; }
      },
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials.password ||
          credentials.email.length > 254 ||
          credentials.password.length > 200
        )
          return null;
        const email = emailKey(credentials.email);
        await rateLimit(`login:${email}`, 15);
        const matches = await (
          await getUsersCollection()
        )
          .find({ $expr: { $eq: [{ $toLower: "$email" }, email] } })
          .limit(2)
          .toArray();
        const user = matches.length === 1 ? matches[0] : null;
        if (
          !user ||
          user.disabled ||
          !user.password ||
          (user.role === "external" && !user.emailVerifiedAt)
        )
          return null;
        if (!(await bcrypt.compare(credentials.password, user.password)))
          return null;
        return {
          id: user._id.toString(),
          email: user.email,
          role: staffRole(user) || "external",
          sessionVersion: user.sessionVersion || 0,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/account/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sessionVersion = user.sessionVersion || 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = token.role;
        session.user.sessionVersion = token.sessionVersion || 0;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/") && !url.startsWith("//"))
        return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },
  logger: {
    error(code) {
      console.error("Authentication error:", code);
    },
    warn(code) {
      console.warn("Authentication warning:", code);
    },
    debug() {},
  },
};
