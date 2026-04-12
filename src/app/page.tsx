import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

const roleRedirects: Record<Role, string> = {
  ADMIN:         "/admin/reportes",
  JEFE_SERVICIO: "/jefe/validaciones",
  ALUMNO:        "/alumno/jornadas",
};

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  if (session.user.mustChangePassword) redirect("/cambiar-password");

  const dest = roleRedirects[session.user.role as Role];
  redirect(dest ?? "/login");
}
