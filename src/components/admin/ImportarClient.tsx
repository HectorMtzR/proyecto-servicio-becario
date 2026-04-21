"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { toast } from "sonner";
import InstruccionesImport from "./InstruccionesImport";
import {
  previewImportAlumnos,
  previewImportJefes,
  previewImportAsignaciones,
  confirmImportAlumnos,
  confirmImportJefes,
  confirmImportAsignaciones,
  type RowError,
} from "@/actions/importar";
import type {
  AlumnoCsvRow,
  JefeCsvRow,
  AsignacionCsvRow,
  ImportType,
} from "@/lib/validations/importar";
import { MAX_CSV_ROWS } from "@/lib/validations/importar";

type ValidRow<T> = { rowNumber: number; data: T };

interface PreviewState {
  type:    ImportType;
  valid:   ValidRow<AlumnoCsvRow | JefeCsvRow | AsignacionCsvRow>[];
  invalid: RowError[];
  total:   number;
}

const TEMPLATES: Record<ImportType, { headers: string[]; example: string[][] }> = {
  alumnos: {
    headers: ["name", "email", "studentId", "careerName", "semester", "enrollmentYear", "scholarshipPercent", "tipo_beca"],
    example: [
      ["Juan Pérez Martínez", "juan.perez@anahuac.mx", "00123456", "Ingeniería en Sistemas", "5", "2023", "50", "ACADEMICA"],
      ["Ana García López",    "ana.garcia@anahuac.mx", "00123457", "Administración",         "3", "2024", "75", "SEP"],
    ],
  },
  jefes: {
    headers: ["name", "email"],
    example: [
      ["María López García", "maria.lopez@anahuac.mx"],
      ["Carlos Ruiz Díaz",   "carlos.ruiz@anahuac.mx"],
    ],
  },
  asignaciones: {
    headers: ["studentEmail", "supervisorEmail", "periodName", "department"],
    example: [
      ["juan.perez@anahuac.mx", "maria.lopez@anahuac.mx", "Agosto - Diciembre 2024", "Laboratorios TI"],
      ["ana.garcia@anahuac.mx", "carlos.ruiz@anahuac.mx", "Agosto - Diciembre 2024", "Coordinación Académica"],
    ],
  },
};

const TABS: { key: ImportType; label: string; icon: string }[] = [
  { key: "alumnos",      label: "Alumnos",      icon: "school" },
  { key: "jefes",        label: "Jefes",        icon: "supervisor_account" },
  { key: "asignaciones", label: "Asignaciones", icon: "assignment_ind" },
];

const MAX_FILE_BYTES = 2 * 1024 * 1024;

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const v = String(cell ?? "");
          if (v.includes(",") || v.includes('"') || v.includes("\n")) {
            return `"${v.replace(/"/g, '""')}"`;
          }
          return v;
        })
        .join(","),
    )
    .join("\r\n");
}

function downloadBlob(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ImportarClient() {
  const router = useRouter();
  const [type, setType] = useState<ImportType>("alumnos");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleTypeChange(next: ImportType) {
    if (next === type) return;
    setType(next);
    reset();
  }

  function downloadTemplate() {
    const { headers, example } = TEMPLATES[type];
    const csv = toCsv([headers, ...example]);
    downloadBlob(`plantilla-${type}.csv`, csv);
  }

  function downloadErrors() {
    if (!preview || preview.invalid.length === 0) return;
    const { headers } = TEMPLATES[preview.type];
    const rows = [
      [...headers, "error"],
      ...preview.invalid.map((e) => [
        ...headers.map((h) => String(e.raw[h] ?? "")),
        e.error,
      ]),
    ];
    downloadBlob(`errores-${preview.type}.csv`, toCsv(rows));
  }

  function parseFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("El archivo excede 2 MB");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("El archivo debe ser .csv");
      return;
    }

    Papa.parse<Record<string, unknown>>(file, {
      header:           true,
      skipEmptyLines:   true,
      transformHeader:  (h) => h.trim().replace(/^\uFEFF/, ""),
      delimitersToGuess: [",", ";", "\t"],
      complete: (result) => {
        const rows = result.data;
        if (!rows || rows.length === 0) {
          toast.error("El archivo está vacío");
          return;
        }
        if (rows.length > MAX_CSV_ROWS) {
          toast.error(`Máximo ${MAX_CSV_ROWS} filas. Tu archivo tiene ${rows.length}.`);
          return;
        }
        setFileName(file.name);
        runPreview(rows);
      },
      error: (err) => {
        console.error(err);
        toast.error("No se pudo leer el archivo CSV");
      },
    });
  }

  function runPreview(rows: Record<string, unknown>[]) {
    startTransition(async () => {
      let res;
      if (type === "alumnos")      res = await previewImportAlumnos(rows);
      else if (type === "jefes")   res = await previewImportJefes(rows);
      else                         res = await previewImportAsignaciones(rows);

      if (!res.success || !res.data) {
        toast.error(res.error ?? "No se pudo validar el archivo");
        return;
      }

      setPreview({
        type,
        valid:   res.data.valid as ValidRow<AlumnoCsvRow | JefeCsvRow | AsignacionCsvRow>[],
        invalid: res.data.invalid,
        total:   res.data.total,
      });
    });
  }

  function handleConfirm() {
    if (!preview || preview.valid.length === 0) return;
    const rows = preview.valid.map((v) => v.data);

    startTransition(async () => {
      let res;
      if (preview.type === "alumnos") {
        res = await confirmImportAlumnos(rows as AlumnoCsvRow[]);
      } else if (preview.type === "jefes") {
        res = await confirmImportJefes(rows as JefeCsvRow[]);
      } else {
        res = await confirmImportAsignaciones(rows as AsignacionCsvRow[]);
      }

      if (!res.success) {
        toast.error(res.error ?? "No se pudo completar la importación");
        return;
      }
      toast.success(`Se crearon ${res.data?.created ?? rows.length} registro(s)`);
      reset();
      router.refresh();
    });
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  }

  const previewRows = useMemo(() => {
    if (!preview) return [];
    const vi = preview.invalid.map((r) => ({ ok: false, rowNumber: r.rowNumber, raw: r.raw, error: r.error }));
    const vo = preview.valid.map((r) => ({
      ok:        true,
      rowNumber: r.rowNumber,
      raw:       r.data as unknown as Record<string, unknown>,
      error:     null as string | null,
    }));
    return [...vi, ...vo].sort((a, b) => a.rowNumber - b.rowNumber);
  }, [preview]);

  const columns = preview ? TEMPLATES[preview.type].headers : [];

  return (
    <section className="space-y-6 p-8">
      <div>
        <h1 className="font-headline text-2xl font-black tracking-tight text-on-surface">
          Importación masiva por CSV
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Crea usuarios y asignaciones en lote subiendo un archivo CSV.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = type === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTypeChange(t.key)}
              className={
                active
                  ? "inline-flex items-center gap-2 rounded-full bg-primary-container px-5 py-2 text-sm font-bold text-on-primary-container shadow-btn-primary"
                  : "inline-flex items-center gap-2 rounded-full bg-surface-container-low px-5 py-2 text-sm font-semibold text-secondary hover:bg-surface-container-high"
              }
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      <InstruccionesImport type={type} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-3 text-sm font-bold text-on-surface transition-all hover:bg-surface-variant"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Descargar plantilla
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-3 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0"
          disabled={isPending}
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          Subir archivo CSV
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFilePick}
        />

        {fileName && (
          <span className="text-sm text-secondary">
            <span className="material-symbols-outlined align-middle text-[16px]">description</span>{" "}
            {fileName}
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={
          isDragging
            ? "flex min-h-[140px] items-center justify-center rounded-xl bg-primary-container/10 p-6 text-center ring-2 ring-primary-container"
            : "flex min-h-[140px] items-center justify-center rounded-xl bg-surface-container-low p-6 text-center"
        }
      >
        <div>
          <span className="material-symbols-outlined text-4xl text-secondary">cloud_upload</span>
          <p className="mt-2 text-sm text-on-surface-variant">
            Arrastra aquí tu archivo <strong>.csv</strong> o usa el botón para seleccionarlo.
          </p>
          <p className="mt-1 text-xs text-secondary">
            Máximo {MAX_CSV_ROWS} filas · 2 MB · UTF-8
          </p>
        </div>
      </div>

      {isPending && !preview && (
        <div className="rounded-xl bg-surface-container-low p-6 text-center text-sm text-secondary">
          Procesando archivo...
        </div>
      )}

      {preview && (
        <div className="space-y-4 rounded-xl bg-surface-container-lowest p-6 shadow-[0_4px_32px_rgba(25,28,29,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-headline text-lg font-bold tracking-tight text-on-surface">
                Vista previa
              </h2>
              <p className="mt-1 text-sm text-secondary">
                <strong className="text-tertiary">{preview.valid.length} válida(s)</strong>
                {" · "}
                <strong className="text-error">{preview.invalid.length} con error(es)</strong>
                {" · "}
                {preview.total} fila(s) total
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-variant"
              >
                Cancelar
              </button>
              {preview.invalid.length > 0 && (
                <button
                  type="button"
                  onClick={downloadErrors}
                  className="inline-flex items-center gap-2 rounded-xl bg-error-container px-4 py-2 text-sm font-bold text-on-error-container hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Descargar errores
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={preview.valid.length === 0 || isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-5 py-2 text-sm font-bold text-on-primary-container shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Importar {preview.valid.length} fila(s)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-high">
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">#</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">Estado</th>
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">
                      {c}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-secondary">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {previewRows.map((r) => (
                  <tr
                    key={r.rowNumber}
                    className={r.ok ? "hover:bg-surface-bright" : "bg-error-container/30"}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-secondary">{r.rowNumber}</td>
                    <td className="px-3 py-2">
                      {r.ok ? (
                        <span className="rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-on-tertiary-fixed">
                          OK
                        </span>
                      ) : (
                        <span className="rounded-full bg-error-container px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-on-error-container">
                          Error
                        </span>
                      )}
                    </td>
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-2 text-on-surface">
                        {String(r.raw?.[c] ?? "")}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-xs text-error">{r.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
