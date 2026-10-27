'use client';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
export default function StaffEmailSignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const values = new URLSearchParams(location.hash.slice(1));
    if (values.get('token')) {
      setEmail(values.get('email') || ''); setToken(values.get('token') || ''); setSent(true);
      history.replaceState(null, '', location.pathname + location.search);
    }
  }, []);
  async function requestEmail() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/account/staff-signin', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please try again.');
      setSent(true); setToken(''); setCode(''); setMessage(data.message);
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sent) return requestEmail();
    setBusy(true); setMessage('');
    try {
      const result = await signIn('staff-email', { email, code, token, redirect:false });
      if (!result?.ok || result.error) throw new Error('This link or code is invalid, expired, or already used. Request a new email and try again.');
      location.href='/admin';
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <section className="staff-email-signin"><h2>Sign in by email</h2><p>Use a secure link or enter the code from your email.</p>{message && <p role="status" className="portal-alert">{message}</p>}<form onSubmit={submit}><label>Work email<input type="email" required autoComplete="email" value={email} disabled={sent || busy} onChange={e=>setEmail(e.target.value)} /></label>{sent && !token && <label>Email code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder="8-digit code" /></label>}<button disabled={busy}>{busy?'Please wait…':!sent?'Email me a link and code':token?'Continue to workspace':'Verify code and sign in'}</button></form>{sent && <div className="portal-actions"><button className="secondary" disabled={busy} onClick={requestEmail}>Send a new email</button><button className="secondary" disabled={busy} onClick={()=>{setSent(false);setToken('');setCode('');setMessage('');}}>Use another email</button></div>}</section>;
}
