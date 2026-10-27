import { body, failure, json } from '@/lib/portal/server';
import { validEmail } from '@/lib/portal/accounts';
import { requestStaffSignIn } from '@/lib/staff-signin';
export async function POST(request: Request) {
  try {
    const data = await body(request, 1000);
    const email = validEmail(data.email);
    // Do not reveal account existence or delivery status to anonymous callers.
    try { await requestStaffSignIn(email); } catch { /* Generic public response. */ }
    return json({ message: 'If this email belongs to an active SBD staff account, a secure link and code will arrive shortly.' });
  } catch (error) { return failure(error); }
}
