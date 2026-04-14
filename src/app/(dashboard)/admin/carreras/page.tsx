import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listCareersAdmin } from "@/actions/carreras";
import CarrerasClient from "@/components/admin/CarrerasClient";

export default async function AdminCarrerasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const careers = await listCareersAdmin();

  return <CarrerasClient careers={careers} />;
}
