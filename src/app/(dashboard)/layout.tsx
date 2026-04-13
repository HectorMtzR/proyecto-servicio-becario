"use client";

import { logoutAction } from "@/actions/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}

      {/* Botón temporal de logout — se eliminará cuando el sidebar esté implementado */}
      <form
        action={logoutAction}
        className="fixed top-4 right-4 z-50"
      >
        <button
          type="submit"
          className="flex items-center gap-2 bg-surface-container-lowest shadow-card rounded-xl px-4 py-2.5 text-sm font-label font-medium text-secondary hover:text-on-surface hover:shadow-card-hover transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            logout
          </span>
          Cerrar sesión
        </button>
      </form>
    </>
  );
}
