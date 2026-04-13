"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/actions/auth";

type NavItem = {
  href:  string;
  label: string;
  icon:  string;
};

const navByRole: Record<Role, NavItem[]> = {
  ALUMNO: [
    { href: "/alumno/inicio",   label: "Inicio",       icon: "dashboard" },
    { href: "/alumno/jornadas", label: "Mis Jornadas", icon: "calendar_today" },
    { href: "/perfil",          label: "Perfil",       icon: "person" },
  ],
  JEFE_SERVICIO: [
    { href: "/jefe/inicio",       label: "Inicio",      icon: "dashboard" },
    { href: "/jefe/validaciones", label: "Validaciones", icon: "fact_check" },
    { href: "/jefe/alumnos",      label: "Mis Alumnos", icon: "groups" },
    { href: "/perfil",            label: "Perfil",      icon: "person" },
  ],
  ADMIN: [
    { href: "/admin/inicio",       label: "Inicio",       icon: "dashboard" },
    { href: "/admin/usuarios",     label: "Usuarios",     icon: "group" },
    { href: "/admin/asignaciones", label: "Asignaciones", icon: "assignment_ind" },
    { href: "/admin/carreras",     label: "Carreras",     icon: "school" },
    { href: "/admin/periodos",     label: "Períodos",     icon: "event" },
    { href: "/admin/reportes",     label: "Reportes",     icon: "analytics" },
    { href: "/perfil",             label: "Perfil",       icon: "person" },
  ],
};

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navByRole[role];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-zinc-900 px-4 py-6">
      <div className="mb-10 px-2">
        <div className="font-headline text-xl font-bold tracking-tighter text-white">
          Portal Becario
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Anáhuac · Servicio Becario
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-3 rounded-xl border-r-4 border-orange-500 bg-white/5 px-4 py-3 font-headline text-sm font-bold tracking-tight text-white transition-all"
                  : "flex items-center gap-3 rounded-xl px-4 py-3 font-headline text-sm tracking-tight text-zinc-400 transition-all duration-200 hover:bg-zinc-800/50 hover:text-white"
              }
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 pt-6">
        {role === "ALUMNO" && (
          <button
            type="button"
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 text-sm font-bold text-on-primary-container transition-all active:scale-95 active:opacity-80"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Registrar Jornada
          </button>
        )}

        <Link
          href="/configuracion"
          className="flex items-center gap-3 rounded-xl px-4 py-3 font-headline text-sm tracking-tight text-zinc-400 transition-colors hover:text-white"
        >
          <span className="material-symbols-outlined">settings</span>
          Configuración
        </Link>
        <Link
          href="/ayuda"
          className="flex items-center gap-3 rounded-xl px-4 py-3 font-headline text-sm tracking-tight text-zinc-400 transition-colors hover:text-white"
        >
          <span className="material-symbols-outlined">help</span>
          Ayuda
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-headline text-sm tracking-tight text-zinc-400 transition-colors hover:text-white"
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
