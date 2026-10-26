import { notFound } from "next/navigation";
import AccountForm from "@/components/portal/AccountForm";
export const metadata = {
  title: "Your account | Senior By Design",
  robots: { index: false, follow: false },
};
export default function Page({ params }: { params: { mode: string } }) {
  if (!["login", "reset", "accept", "change"].includes(params.mode)) notFound();
  return (
    <AccountForm
      mode={params.mode as "login" | "reset" | "accept" | "change"}
    />
  );
}
