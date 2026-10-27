import { notFound, redirect } from "next/navigation";
import PortalPage from "../page";
export const dynamic = "force-dynamic";
export { metadata } from "../page";
export default function Page({ params }: { params: { path: string[] } }) {
  const [section, kind, method] = params.path;
  if (section === "approvals") redirect("/portal/requests");
  if (section === "imports") redirect("/portal/create/project/import");
  if (!["overview", "projects", "requests", "orders", "documents", "organizations", "members", "create"].includes(section)) notFound();
  if (section === "create") {
    if (params.path.length > 3 || (kind && !["project", "company"].includes(kind)) || (method && !["scratch", "import"].includes(method))) notFound();
  } else if (params.path.length > (section === "projects" ? 2 : 1)) notFound();
  return <PortalPage />;
}
