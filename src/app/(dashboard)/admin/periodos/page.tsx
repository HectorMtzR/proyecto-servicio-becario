import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listPeriodsAdmin } from "@/actions/periodos";
import PeriodosClient from "@/components/admin/PeriodosClient";

export default async function AdminPeriodosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const periods = await listPeriodsAdmin();

  return <PeriodosClient periods={periods} />;
}
