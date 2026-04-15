import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImportarClient from "@/components/admin/ImportarClient";

export default async function AdminImportarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return <ImportarClient />;
}
