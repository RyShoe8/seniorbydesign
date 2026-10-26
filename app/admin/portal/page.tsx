import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/portal/server";
import PortalApp from "@/components/portal/PortalApp";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await getStaffSession())) redirect("/account/login?staff=1");
  return <PortalApp management />;
}
