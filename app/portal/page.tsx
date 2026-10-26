import { redirect } from 'next/navigation';
import { currentActor } from '@/lib/portal/server';
import PortalApp from '@/components/portal/PortalApp';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Client portal | Senior By Design', robots: { index: false, follow: false } };
export default async function Page() { if (!await currentActor()) redirect('/account/login'); return <PortalApp />; }
