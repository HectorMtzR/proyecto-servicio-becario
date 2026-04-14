"use client";

import { useMemo, useState } from "react";
import type { ReportRow } from "@/actions/reportes";

type SortKey =
  | "studentName"
  | "matricula"
  | "careerName"
  | "faculty"
  | "scholarshipPercent"
  | "targetHours"
  | "accumulatedHours"
  | "progressPercent"
  | "estatus";

type SortDir = "asc" | "desc";

function EstatusBadge({ value }: { value: ReportRow["estatus"] }) {
  const styles: Record<ReportRow["estatus"], string> = {
    "En Tiempo": "bg-tertiary-fixed text-on-tertiary-fixed",
    "Atrasado":  "bg-error-container text-on-error-container",
    "Sin Datos": "bg-surface-container-high text-on-surface-variant",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${styles[value]}`}
    >
      {value}
    </span>
  );
}

export default function ReportesTable({ rows }: { rows: ReportRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("studentName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggle(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      let cmp = 0;
      if (typeof va === "number" && typeof vb === "number") cmp = va - vb;
      else cmp = String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-12 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
          <span className="material-symbols-outlined text-3xl text-secondary">search_off</span>
        </div>
        <h3 className="font-headline text-xl font-black tracking-tight text-on-surface">
          Sin resultados
        </h3>
        <p className="mt-2 text-sm text-secondary">
          Ajusta los filtros para ver más alumnos.
        </p>
      </div>
    );
  }

  const headers: { key: SortKey; label: string; align?: "center" | "right" }[] = [
    { key: "studentName",        label: "Alumno" },
    { key: "matricula",          label: "Matrícula" },
    { key: "careerName",         label: "Carrera" },
    { key: "faculty",            label: "Facultad" },
    { key: "scholarshipPercent", label: "% Beca",      align: "center" },
    { key: "targetHours",        label: "Meta",        align: "center" },
    { key: "accumulatedHours",   label: "Acumuladas",  align: "center" },
    { key: "progressPercent",    label: "% Completado",align: "center" },
    { key: "estatus",            label: "Estatus" },
  ];

  return (
    <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50">
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={`px-5 py-4 font-label text-xs font-bold uppercase tracking-widest text-secondary ${
                    h.align === "center" ? "text-center" : h.align === "right" ? "text-right" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(h.key)}
                    className="inline-flex items-center gap-1 hover:text-on-surface"
                  >
                    {h.label}
                    <span className="material-symbols-outlined text-[14px]">
                      {sortKey === h.key ? (sortDir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sorted.map((r) => (
              <tr key={r.assignmentId} className="transition-colors hover:bg-surface-bright">
                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-on-surface">{r.studentName}</p>
                  <p className="mt-0.5 font-label text-[11px] font-medium uppercase tracking-widest text-secondary">
                    {r.supervisorName}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm text-on-surface">{r.matricula}</td>
                <td className="px-5 py-4 text-sm text-on-surface">{r.careerName}</td>
                <td className="px-5 py-4 text-sm text-secondary">{r.faculty}</td>
                <td className="px-5 py-4 text-center text-sm font-bold text-on-surface">
                  {r.scholarshipPercent}%
                </td>
                <td className="px-5 py-4 text-center text-sm text-on-surface">{r.targetHours} h</td>
                <td className="px-5 py-4 text-center text-sm font-bold text-on-surface">
                  {r.accumulatedHours.toFixed(1)} h
                </td>
                <td className="w-44 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-primary-container transition-all"
                        style={{ width: `${r.progressPercent}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-bold text-on-surface">
                      {r.progressPercent}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <EstatusBadge value={r.estatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
