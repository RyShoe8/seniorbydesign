import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/portal/server";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await getStaffSession())) redirect("/account/login?staff=1");
  redirect("/portal");
}
