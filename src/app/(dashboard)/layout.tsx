import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, role } = session.user;

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar role={role} />
      <TopBar name={name ?? "Usuario"} role={role} />
      <main className="ml-64 min-h-screen pt-16">{children}</main>
    </div>
  );
}
