import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listAssignmentsData } from "@/actions/asignaciones";
import AsignacionesClient from "@/components/admin/AsignacionesClient";

export default async function AdminAsignacionesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const data = await listAssignmentsData();

  return (
    <AsignacionesClient
      assignments={data.assignments}
      activePeriod={data.activePeriod}
      availableStudents={data.availableStudents}
      supervisors={data.supervisors}
    />
  );
}
