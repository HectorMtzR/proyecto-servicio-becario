"use client";

import { useMemo, useState } from "react";
import AssignmentFormModal from "./AssignmentFormModal";
import type {
  AdminAssignmentRow,
  ActivePeriodInfo,
  StudentOption,
  SupervisorOption,
} from "@/actions/asignaciones";

interface Props {
  assignments:       AdminAssignmentRow[];
  activePeriod:      ActivePeriodInfo | null;
  availableStudents: StudentOption[];
  supervisors:       SupervisorOption[];
}

type ScopeFilter = "ACTIVE" | "ALL";

export default function AsignacionesClient({
  assignments,
  activePeriod,
  availableStudents,
  supervisors,
}: Props) {
  const [modal, setModal] = useState<
    { mode: "create" } | { mode: "edit"; assignment: AdminAssignmentRow } | null
  >(null);

  const [scope, setScope] = useState<ScopeFilter>("ACTIVE");

  const filtered = useMemo(() => {
    if (scope === "ACTIVE") {
      return assignments.filter((a) => !a.periodIsClosed);
    }
    return assignments;
  }, [assignments, scope]);

  const canCreate = activePeriod !== null;

  return (
    <section className="space-y-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-black tracking-tight text-on-surface">
            Asignaciones alumno ↔ jefe
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {activePeriod
              ? `Período activo: ${activePeriod.name}`
              : "No hay un período activo abierto. Crea uno antes de registrar asignaciones."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          disabled={!canCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Crear asignación
        </button>
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl bg-surface-container-low p-4">
        <div>
          <label
            htmlFor="filter-scope"
            className="mb-1 block font-label text-[10px] font-bold uppercase tracking-widest text-secondary"
          >
            Mostrar
          </label>
          <select
            id="filter-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as ScopeFilter)}
            className="rounded-xl bg-surface-container-lowest px-4 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
          >
            <option value="ACTIVE">Períodos abiertos</option>
            <option value="ALL">Todos (incluye históricos)</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-secondary">
            No hay asignaciones para mostrar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-zinc-50">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Alumno
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Jefe
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Período
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Departamento
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Meta
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Acumuladas
                  </th>
                  <th className="px-6 py-4 text-left font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right font-label text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map((a) => {
                  const hours = Math.round((a.accumulatedMinutes / 60) * 10) / 10;
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-surface-bright">
                      <td className="px-6 py-4">
                        <p className="font-medium text-on-surface">{a.studentName}</p>
                        <p className="mt-0.5 text-xs text-secondary">
                          {a.studentMatricula ?? "—"}
                          {a.scholarshipPercent !== null && ` · ${a.scholarshipPercent}% beca`}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface">{a.supervisorName}</td>
                      <td className="px-6 py-4 text-sm text-secondary">{a.periodName}</td>
                      <td className="px-6 py-4 text-sm text-on-surface">{a.department}</td>
                      <td className="px-6 py-4 text-sm text-on-surface">{a.targetHours}h</td>
                      <td className="px-6 py-4 text-sm text-on-surface">{hours}h</td>
                      <td className="px-6 py-4">
                        {a.periodIsClosed ? (
                          <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                            Cerrado
                          </span>
                        ) : a.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-tertiary-fixed px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-tertiary-fixed">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {a.periodIsClosed ? (
                          <span className="text-xs text-secondary">Histórico</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setModal({ mode: "edit", assignment: a })}
                            className="inline-flex items-center gap-1 rounded-xl bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface transition-all hover:bg-surface-container-high"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssignmentFormModal
        open={modal !== null}
        mode={modal?.mode ?? "create"}
        assignment={modal?.mode === "edit" ? modal.assignment : null}
        activePeriod={activePeriod}
        availableStudents={availableStudents}
        supervisors={supervisors}
        onClose={() => setModal(null)}
      />
    </section>
  );
}
