import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listUsers, listCareers } from "@/actions/usuarios";
import UsuariosClient from "@/components/admin/UsuariosClient";

export default async function AdminUsuariosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const [users, careers] = await Promise.all([listUsers(), listCareers()]);

  return <UsuariosClient users={users} careers={careers} />;
}
