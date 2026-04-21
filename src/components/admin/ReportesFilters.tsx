"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReportFilterOptions } from "@/actions/reportes";

export default function ReportesFilters({
  options,
  currentPeriodId,
}: {
  options:         ReportFilterOptions;
  currentPeriodId: string | null;
}) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [periodId, setPeriodId]               = useState(currentPeriodId ?? "");
  const [careerId, setCareerId]               = useState(searchParams.get("careerId") ?? "");
  const [faculty, setFaculty]                 = useState(searchParams.get("faculty") ?? "");
  const [supervisorId, setSupervisorId]       = useState(searchParams.get("supervisorId") ?? "");
  const [minBeca, setMinBeca]                 = useState(searchParams.get("minBeca") ?? "");
  const [maxBeca, setMaxBeca]                 = useState(searchParams.get("maxBeca") ?? "");
  const [scholarshipType, setScholarshipType] = useState(searchParams.get("scholarshipType") ?? "");
  const [sinAvance, setSinAvance]             = useState(searchParams.get("sinAvance") === "1");

  function apply() {
    const params = new URLSearchParams();
    if (periodId)      params.set("periodId", periodId);
    if (careerId)      params.set("careerId", careerId);
    if (faculty)       params.set("faculty", faculty);
    if (supervisorId)  params.set("supervisorId", supervisorId);
    if (minBeca)       params.set("minBeca", minBeca);
    if (maxBeca)       params.set("maxBeca", maxBeca);
    if (scholarshipType) params.set("scholarshipType", scholarshipType);
    if (sinAvance)       params.set("sinAvance", "1");
    startTransition(() => {
      router.push(`/admin/reportes?${params.toString()}`);
    });
  }

  function reset() {
    setPeriodId(options.activePeriodId ?? "");
    setCareerId("");
    setFaculty("");
    setSupervisorId("");
    setMinBeca("");
    setMaxBeca("");
    setScholarshipType("");
    setSinAvance(false);
    startTransition(() => {
      router.push(`/admin/reportes`);
    });
  }

  const selectClass =
    "w-full rounded-lg bg-surface-container-low px-3 py-2.5 font-body text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary-container";
  const labelClass =
    "mb-1.5 block font-label text-[11px] font-bold uppercase tracking-widest text-secondary";

  return (
    <section className="rounded-xl bg-surface-container-lowest p-6 shadow-card">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-1">
          <label className={labelClass}>Período</label>
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className={selectClass}
          >
            {options.periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.isActive && !p.isClosed ? " (activo)" : p.isClosed ? " (cerrado)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1">
          <label className={labelClass}>Carrera</label>
          <select
            value={careerId}
            onChange={(e) => setCareerId(e.target.value)}
            className={selectClass}
          >
            <option value="">Todas</option>
            {options.careers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1">
          <label className={labelClass}>Facultad</label>
          <select
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            className={selectClass}
          >
            <option value="">Todas</option>
            {options.faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1">
          <label className={labelClass}>Jefe de servicio</label>
          <select
            value={supervisorId}
            onChange={(e) => setSupervisorId(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos</option>
            {options.supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1">
          <label className={labelClass}>Tipo de beca</label>
          <select
            value={scholarshipType}
            onChange={(e) => setScholarshipType(e.target.value)}
            className={selectClass}
          >
            <option value="">Todos</option>
            <option value="ACADEMICA">Académica</option>
            <option value="EXCELENCIA">Excelencia</option>
            <option value="DEPORTIVA">Deportiva</option>
            <option value="CULTURAL">Cultural</option>
            <option value="COMERCIAL">Comercial</option>
            <option value="LIDERAZGO_SOCIAL">Liderazgo Social</option>
            <option value="SEP">SEP</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className={labelClass}>% Beca (rango)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Mín"
              value={minBeca}
              onChange={(e) => setMinBeca(e.target.value)}
              className={selectClass}
            />
            <span className="text-secondary">—</span>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Máx"
              value={maxBeca}
              onChange={(e) => setMaxBeca(e.target.value)}
              className={selectClass}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="inline-flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={sinAvance}
              onChange={(e) => setSinAvance(e.target.checked)}
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors ${sinAvance ? "bg-primary-container" : "bg-surface-container-high"}`}
            />
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${sinAvance ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </div>
          <span className="font-label text-sm font-semibold text-on-surface">
            Solo alumnos sin avance (0%)
          </span>
          {sinAvance && (
            <span className="rounded-full bg-error-container px-2 py-0.5 font-label text-[10px] font-black uppercase tracking-wider text-on-error-container">
              Activo
            </span>
          )}
        </label>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-surface-container-high px-4 py-2 font-label text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-primary-container px-5 py-2 font-label text-sm font-bold text-on-primary shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5"
        >
          Aplicar filtros
        </button>
      </div>
    </section>
  );
}
