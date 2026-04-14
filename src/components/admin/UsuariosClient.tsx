"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  getDeactivateBlockReason,
  setUserActiveAction,
  type AdminUserRow,
  type CareerOption,
} from "@/actions/usuarios";
import type { Role } from "@/types";
import UserFormModal from "./UserFormModal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface Props {
  users:   AdminUserRow[];
  careers: CareerOption[];
}

type RoleFilter   = "ALL" | Role;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const roleLabel: Record<Role, string> = {
  ADMIN:         "Admin",
  JEFE_SERVICIO: "Jefe",
  ALUMNO:        "Alumno",
};

const roleChip: Record<Role, string> = {
  ADMIN:         "bg-primary-container/20 text-primary",
  JEFE_SERVICIO: "bg-tertiary-fixed text-on-tertiary-fixed",
  ALUMNO:        "bg-surface-container-high text-on-surface-variant",
};

export default function UsuariosClient({ users, careers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [roleFilter,   setRoleFilter]   = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [modal, setModal] = useState<
    { mode: "create" } | { mode: "edit"; user: AdminUserRow } | null
  >(null);

  const [confirm, setConfirm] = useState<
    | { action: "deactivate"; user: AdminUserRow }
    | { action: "activate";   user: AdminUserRow }
    | null
  >(null);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter === "ACTIVE"   && !u.isActive) return false;
      if (statusFilter === "INACTIVE" &&  u.isActive) return false;
      return true;
    });
  }, [users, roleFilter, statusFilter]);

  async function openDeactivate(user: AdminUserRow) {
    const res = await getDeactivateBlockReason(user.id);
    if (!res.success) {
      toast.error(res.error ?? "No se pudo verificar el usuario");
      return;
    }
    setBlockReason(res.data?.reason ?? null);
    setConfirm({ action: "deactivate", user });
  }

  function openActivate(user: AdminUserRow) {
    setBlockReason(null);
    setConfirm({ action: "activate", user });
  }

  function handleConfirm() {
    if (!confirm) return;
    if (confirm.action === "deactivate" && blockReason) return;
    const active = confirm.action === "activate";
    const userId = confirm.user.id;
    startTransition(async () => {
      const res = await setUserActiveAction(userId, active);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo actualizar el usuario");
        return;
      }
      toast.success(active ? "Usuario activado" : "Usuario desactivado");
      setConfirm(null);
      setBlockReason(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-black tracking-tight text-on-surface">
            Gestión de usuarios
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {users.length} usuario(s) en el sistema
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Crear usuario
        </button>
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl bg-surface-container-low p-4">
        <div>
          <label
            htmlFor="filter-role"
            className="mb-1 block font-label text-[10px] font-bold uppercase tracking-widest text-secondary"
          >
            Rol
          </label>
          <select
            id="filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="rounded-xl bg-surface-container-lowest px-4 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
          >
            <option value="ALL">Todos</option>
            <option value="ADMIN">Admin</option>
            <option value="JEFE_SERVICIO">Jefe</option>
            <option value="ALUMNO">Alumno</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="filter-status"
            className="mb-1 block font-label text-[10px] font-bold uppercase tracking-widest text-secondary"
          >
            Estado
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl bg-surface-container-lowest px-4 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-secondary">
            No hay usuarios que coincidan con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-zinc-50">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Correo
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Creado
                  </th>
                  <th className="px-6 py-4 text-right font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-surface-bright">
                    <td className="px-6 py-4">
                      <p className="font-medium text-on-surface">{u.name}</p>
                      {u.profile && (
                        <p className="mt-0.5 text-xs text-secondary">
                          {u.profile.studentId} · {u.profile.careerName}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${roleChip[u.role]}`}
                      >
                        {roleLabel[u.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-tertiary-fixed">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {format(new Date(u.createdAt), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setModal({ mode: "edit", user: u })}
                          className="inline-flex items-center gap-1 rounded-xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-container-high"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Editar
                        </button>
                        {u.isActive ? (
                          <button
                            type="button"
                            onClick={() => openDeactivate(u)}
                            className="inline-flex items-center gap-1 rounded-xl border-2 border-error-container px-3 py-2 text-xs font-bold text-error transition-all hover:bg-error-container/40"
                          >
                            <span className="material-symbols-outlined text-[16px]">block</span>
                            Desactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openActivate(u)}
                            className="inline-flex items-center gap-1 rounded-xl bg-tertiary-fixed px-3 py-2 text-xs font-bold text-on-tertiary-fixed transition-all hover:opacity-80"
                          >
                            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                            Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserFormModal
        open={modal !== null}
        mode={modal?.mode ?? "create"}
        user={modal?.mode === "edit" ? modal.user : null}
        careers={careers}
        onClose={() => setModal(null)}
      />

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.action === "activate"
            ? "Activar usuario"
            : blockReason
              ? "No se puede desactivar"
              : "Desactivar usuario"
        }
        message={
          confirm?.action === "activate"
            ? `¿Deseas reactivar a ${confirm.user.name}?`
            : blockReason
              ? blockReason
              : `¿Deseas desactivar a ${confirm?.user.name}? El usuario no podrá iniciar sesión.`
        }
        confirmText={
          confirm?.action === "activate"
            ? "Activar"
            : blockReason
              ? "Entendido"
              : "Desactivar"
        }
        tone={confirm?.action === "activate" ? "primary" : blockReason ? "primary" : "danger"}
        isPending={isPending}
        onConfirm={() => {
          if (confirm?.action === "deactivate" && blockReason) {
            setConfirm(null);
            setBlockReason(null);
            return;
          }
          handleConfirm();
        }}
        onCancel={() => {
          if (isPending) return;
          setConfirm(null);
          setBlockReason(null);
        }}
      />
    </section>
  );
}
