import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "../db";
import { sendTransactionalEmail } from "../brevo";
import { collections, transaction } from "./db";
import {
  emailKey,
  hash,
  isStaff,
  PortalError,
  text,
  staffRole,
} from "./policy";
import { canAccessPortalPreview } from "./access";
import type { Actor, MembershipRole } from "./types";

interface AccountToken {
  _id: string;
  email: string;
  kind: "invite" | "reset";
  organizationId?: string;
  role?: MembershipRole;
  staff?: boolean;
  expiresAt: Date;
  createdAt: Date;
  createdBy: string;
  delivery: "pending" | "sent" | "failed";
  usedAt?: Date;
  revoked?: boolean;
}
export function validEmail(v: unknown) {
  const email = emailKey(text(v, "Email", 254));
  if (!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email))
    throw new PortalError("Enter a valid email address");
  return email;
}
export function passwordValue(v: unknown) {
  if (typeof v !== "string") throw new PortalError("Enter a password");
  const password = v;
  if (password.length < 12 || Buffer.byteLength(password) > 72)
    throw new PortalError(
      "Use at least 12 characters and at most 72 bytes for your password",
    );
  return password;
}
export async function canManageOrganization(
  actor: Actor,
  organizationId: string,
) {
  const { organizations } = await collections();
  const org = await organizations.findOne({
    _id: organizationId,
    active: true,
  });
  if (!org) throw new PortalError("Organization not found", 404);
  if (
    !isStaff(actor) &&
    !actor.memberships.some(
      (m) => m.organizationId === org._id && m.role === "admin" && m.active,
    )
  )
    throw new PortalError("Organization administrator access required", 403);
  return org;
}
export async function issueToken(
  email: string,
  options: Pick<
    AccountToken,
    "kind" | "createdBy" | "organizationId" | "role" | "staff"
  >,
) {
  const { db } = await collections();
  const raw = randomBytes(32).toString("hex");
  const token: AccountToken = {
    _id: hash(raw),
    email,
    ...options,
    createdAt: new Date(),
    expiresAt: new Date(
      Date.now() + (options.kind === "invite" ? 72 * 60 : 30) * 60000,
    ),
    delivery: "pending",
  };
  const tokens = db.collection<AccountToken>("accountTokens");
  await tokens.updateMany(
    {
      email,
      kind: options.kind,
      organizationId: options.organizationId || { $exists: false },
      usedAt: { $exists: false },
    },
    { $set: { revoked: true } },
  );
  await tokens.insertOne(token);
  const origin = options.staff
    ? (process.env.SBD_ADMIN_ORIGIN || process.env.NEXTAUTH_URL)
    : (process.env.SBD_PORTAL_ORIGIN || process.env.NEXTAUTH_URL);
  if (!origin) {
    await tokens.updateOne(
      { _id: token._id },
      { $set: { delivery: "failed" } },
    );
    throw new PortalError("Account email origin is not configured", 503);
  }
  const url = new URL("/account/accept", origin);
  url.hash = raw;
  const subject =
    options.kind === "invite"
      ? "Your Senior By Design invitation"
      : "Reset your Senior By Design password";
  try {
    await sendTransactionalEmail(
      [{ email }],
      subject,
      `<p>${subject}</p><p><a href="${url.href}">Continue securely</a></p><p>This personal link expires and can be used once. If unexpected, ignore this email.</p>`,
      `${subject}\n${url.href}`,
    );
    await tokens.updateOne({ _id: token._id }, { $set: { delivery: "sent" } });
  } catch {
    await tokens.updateOne(
      { _id: token._id },
      { $set: { delivery: "failed" } },
    );
    throw new PortalError(
      "Invitation saved, but email could not be sent. Please resend.",
      503,
    );
  }
}
export async function acceptToken(
  raw: string,
  password: unknown,
  actor: Actor | null,
  profile?: { fullName?: unknown; position?: unknown; phone?: unknown },
) {
  if (!/^[a-f0-9]{64}$/.test(raw))
    throw new PortalError("Invalid or expired link");
  const { db, memberships, organizations } = await collections();
  const tokens = db.collection<AccountToken>("accountTokens");
  const preview = await tokens.findOne({
    _id: hash(raw),
    revoked: { $ne: true },
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (!preview) throw new PortalError("Invalid or expired link");
  const profileFields = preview.kind === "invite" ? {
    fullName: text(profile?.fullName, "Full name", 150),
    position: text(profile?.position, "Position", 150),
    phone: profile?.phone ? text(profile.phone, "Phone", 50) : "",
  } : undefined;
  const users = await getUsersCollection();
  const existing = await users
    .find({ $expr: { $eq: [{ $toLower: "$email" }, preview.email] } })
    .limit(2)
    .toArray();
  if (existing.length > 1)
    throw new PortalError(
      "Contact SBD to resolve duplicate email accounts",
      409,
    );
  const user = existing[0];
  if (user?.disabled)
    throw new PortalError("Contact SBD to restore this account", 403);
  if (preview.kind === "invite" && user && actor?.id !== user._id.toString())
    throw new PortalError(
      "Sign in with your existing account, then reopen this invitation. Use Forgot Password if needed.",
      409,
    );
  const passwordHash =
    preview.kind === "reset" || !user
      ? await bcrypt.hash(passwordValue(password), 12)
      : undefined;
  return transaction(async (session) => {
    // Serialize identity creation across invitations to different organizations.
    await db
      .collection<{ _id: string; version: number }>("portalLocks")
      .updateOne(
        { _id: `identity:${preview.email}` },
        { $inc: { version: 1 } },
        { upsert: true, session },
      );
    const liveUsers = await users
      .find(
        { $expr: { $eq: [{ $toLower: "$email" }, preview.email] } },
        { session },
      )
      .limit(2)
      .toArray();
    if (
      liveUsers.length > 1 ||
      (liveUsers[0]?._id.toString() || "") !== (user?._id.toString() || "") ||
      liveUsers[0]?.disabled
    )
      throw new PortalError(
        "Account changed. Please reopen the invitation.",
        409,
      );
    const token = await tokens.findOneAndUpdate(
      {
        _id: preview._id,
        revoked: { $ne: true },
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      },
      { $set: { usedAt: new Date() } },
      { session, returnDocument: "before" },
    );
    if (!token) throw new PortalError("Invalid or expired link");
    if (token.kind === "invite") {
      const issuer = ObjectId.isValid(token.createdBy)
        ? await users.findOne(
            { _id: new ObjectId(token.createdBy), disabled: { $ne: true } },
            { session },
          )
        : null;
      if (!issuer) throw new PortalError("Invitation is no longer authorized");
      const role = staffRole(issuer);
      if (token.staff && role !== "admin")
        throw new PortalError("Invitation is no longer authorized");
      if (
        !token.staff &&
        !(role && canAccessPortalPreview({ ...issuer, role })) &&
        !(await memberships.findOne(
          {
            userId: token.createdBy,
            organizationId: token.organizationId,
            role: "admin",
            active: true,
          },
          { session },
        ))
      )
        throw new PortalError("Invitation is no longer authorized");
    }
    const userId = user?._id || new ObjectId();
    if (token.kind === "reset") {
      if (!user) throw new PortalError("Invalid link");
      await users.updateOne(
        { _id: userId, disabled: { $ne: true } },
        {
          $set: {
            password: passwordHash!,
            emailVerifiedAt: new Date(),
            updatedAt: new Date(),
          },
          $inc: { sessionVersion: 1 },
        },
        { session },
      );
    } else {
      if (!user)
        await users.insertOne(
          {
            _id: userId,
            email: token.email,
            ...profileFields,
            password: passwordHash!,
            role: token.staff ? "team" : "external",
            emailVerifiedAt: new Date(),
            sessionVersion: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { session },
        );
      else if (token.staff)
        await users.updateOne(
          { _id: userId, role: { $ne: "admin" } },
          { $set: { role: "team", updatedAt: new Date() } },
          { session },
        );
      if (user && profileFields) await users.updateOne({ _id: userId }, { $set: { ...profileFields, updatedAt: new Date() } }, { session });
      if (token.organizationId) {
        const org = await organizations.findOneAndUpdate(
          { _id: token.organizationId, active: true },
          { $inc: { version: 1 } },
          { session },
        );
        if (!org) throw new PortalError("Organization is no longer active");
        const membershipId = `${userId}:${token.organizationId}`;
        const priorMembership = await memberships.findOne(
          { _id: membershipId },
          { session },
        );
        const membershipRole =
          priorMembership?.active && priorMembership.role === "admin"
            ? "admin"
            : token.role || "member";
        await memberships.updateOne(
          { _id: membershipId },
          {
            $set: {
              userId: userId.toString(),
              email: token.email,
              organizationId: token.organizationId,
              role: membershipRole,
              active: true,
            },
          },
          { upsert: true, session },
        );
      }
    }
    return { success: true };
  });
}
