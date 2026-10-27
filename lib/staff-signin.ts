import { createHmac, randomBytes, randomInt } from 'crypto';
import { getDb, getUsersCollection } from './db';
import { staffRole } from './portal/policy';
import { rateLimit } from './portal/rate-limit';
import { sendTransactionalEmail } from './brevo';

type Challenge = { _id: string; userId: string; sessionVersion: number; linkHash: string; codeHash: string; expiresAt: Date; attempts: number; used: boolean };
function digest(value: string) {
  if (!process.env.NEXTAUTH_SECRET) throw new Error('Authentication is not configured');
  return createHmac('sha256', process.env.NEXTAUTH_SECRET).update(value).digest('hex');
}
async function staff(email: string) {
  const users = await (await getUsersCollection()).find({ $expr: { $eq: [{ $toLower: '$email' }, email] } }).limit(2).toArray();
  const user = users.length === 1 ? users[0] : null;
  return user && !user.disabled && staffRole(user) ? user : null;
}
export async function requestStaffSignIn(email: string) {
  await rateLimit(`staff-email:${email}`, 3);
  const user = await staff(email);
  if (!user) return;
  const origin = process.env.SBD_ADMIN_ORIGIN || process.env.NEXTAUTH_URL;
  if (!origin) throw new Error('Sign-in origin is not configured');
  const raw = randomBytes(32).toString('hex');
  const code = String(randomInt(0, 100000000)).padStart(8, '0');
  const id = digest(`staff:${email}`);
  const challenges = (await getDb()).collection<Challenge>('staffSignInChallenges');
  const linkHash = digest(`link:${raw}`);
  await challenges.replaceOne({ _id: id }, { userId: user._id.toString(), sessionVersion: user.sessionVersion || 0, linkHash, codeHash: digest(`code:${email}:${code}`), expiresAt: new Date(Date.now() + 10 * 60000), attempts: 0, used: false }, { upsert: true });
  const link = new URL('/account/login?staff=1', origin);
  link.hash = new URLSearchParams({ email, token: raw }).toString();
  const url = link.href.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  try {
    await sendTransactionalEmail([{ email }], 'Your SBD secure sign-in link and code', `<p>Sign in to your Senior By Design workspace.</p><p><a href="${url}">Sign in securely</a></p><p>Or enter this code on the sign-in page:</p><p style="font-size:28px;letter-spacing:4px;font-weight:bold">${code}</p><p>The link and code expire in 10 minutes. Using either one invalidates both. Do not share this code. If you did not request this email, ignore it.</p>`, `Sign in to SBD: ${link.href}\nOr enter code: ${code}\nExpires in 10 minutes. Using either option invalidates both. Do not share this code.`);
  } catch {
    await challenges.updateOne({ _id: id, linkHash }, { $set: { used: true } });
    throw new Error('Unable to deliver sign-in email');
  }
}
export async function verifyStaffSignIn(email: string, code?: string, token?: string) {
  if (!email || email.length > 254 || (!/^\d{8}$/.test(code || '') && !/^[a-f0-9]{64}$/.test(token || ''))) return null;
  await rateLimit(`staff-verify:${email}`, 10);
  const user = await staff(email);
  if (!user) return null;
  const challenges = (await getDb()).collection<Challenge>('staffSignInChallenges');
  const filter = { _id: digest(`staff:${email}`), userId: user._id.toString(), sessionVersion: user.sessionVersion || 0, used: false, expiresAt: { $gt: new Date() } };
  const attempt = await challenges.findOneAndUpdate({ ...filter, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { returnDocument: 'after' });
  if (!attempt) return null;
  const credential = token ? { linkHash: digest(`link:${token}`) } : { codeHash: digest(`code:${email}:${code}`) };
  const consumed = await challenges.findOneAndUpdate({ ...filter, ...credential, linkHash: token ? digest(`link:${token}`) : attempt.linkHash, attempts: { $lte: 5 } }, { $set: { used: true } }, { returnDocument: 'after' });
  return consumed ? { id: user._id.toString(), email: user.email, role: staffRole(user)!, sessionVersion: user.sessionVersion || 0 } : null;
}

