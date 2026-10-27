import { redirect } from 'next/navigation';
import { currentActor } from '@/lib/portal/server';
import PortalApp from '@/components/portal/PortalApp';
import { canAccessPortalPreview } from '@/lib/portal/access';
import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Client portal | Senior By Design', robots: { index: false, follow: false } };
export default async function Page() {
  const actor = await currentActor();
  if (!actor) redirect('/account/login');
  if (!canAccessPortalPreview(actor)) notFound();
  return <PortalApp management />;
}
