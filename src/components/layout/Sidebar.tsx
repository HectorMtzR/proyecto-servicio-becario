"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { useUIStore } from "@/stores/ui-store";
import LogoutButton from "@/components/shared/LogoutButton";

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
    { href: "/admin/importar",     label: "Importar CSV", icon: "upload_file" },
    { href: "/perfil",             label: "Perfil",       icon: "person" },
  ],
};

const secondaryLinkClass =
  "flex items-center gap-3 rounded-xl px-4 py-3 font-headline text-sm tracking-tight text-zinc-400 transition-colors hover:text-white";

/**
 * Navegación lateral.
 * - Escritorio (lg+): fija a la izquierda, siempre visible.
 * - Móvil/tablet (< lg): panel deslizable que se abre desde el botón de menú
 *   del TopBar; se cierra al navegar, al tocar el fondo o con Escape.
 */
export default function Sidebar({ role }: { role: Role }) {
  const pathname           = usePathname();
  const items              = navByRole[role];
  const openRegistroManual = useUIStore((s) => s.openRegistroManual);
  const sidebarOpen        = useUIStore((s) => s.sidebarOpen);
  const closeSidebar       = useUIStore((s) => s.closeSidebar);

  // Cerrar con Escape mientras el panel está abierto
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, closeSidebar]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleRegistroManual = () => {
    closeSidebar();
    openRegistroManual();
  };

  return (
    <>
      {/* Fondo oscuro detrás del panel (solo móvil) */}
      <div
        aria-hidden="true"
        onClick={closeSidebar}
        className={
          "fixed inset-0 z-[45] bg-zinc-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden " +
          (sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />

      <aside
        id="app-sidebar"
        aria-label="Navegación principal"
        className={
          "fixed left-0 top-0 z-50 flex h-[100dvh] w-64 flex-col overflow-y-auto bg-zinc-900 px-4 py-6 transition-transform duration-300 ease-out lg:translate-x-0 " +
          (sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full")
        }
      >
        <div className="mb-10 flex items-start justify-between gap-2 px-2">
          <div>
            <div className="font-headline text-xl font-bold tracking-tighter text-white">
              Portal Becario
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Anáhuac · Servicio Becario
            </div>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Cerrar menú"
            className="-mr-2 -mt-1 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                aria-current={active ? "page" : undefined}
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
              onClick={handleRegistroManual}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-3 text-sm font-bold text-on-primary-container transition-all active:scale-95 active:opacity-80"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Registrar Jornada
            </button>
          )}

          <Link href="/configuracion" onClick={closeSidebar} className={secondaryLinkClass}>
            <span className="material-symbols-outlined">settings</span>
            Configuración
          </Link>
          <Link href="/ayuda" onClick={closeSidebar} className={secondaryLinkClass}>
            <span className="material-symbols-outlined">help</span>
            Ayuda
          </Link>

          <LogoutButton className={"w-full " + secondaryLinkClass}>
            <span className="material-symbols-outlined">logout</span>
            Cerrar sesión
          </LogoutButton>
        </div>
      </aside>
    </>
  );
}
