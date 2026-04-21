import type { Status } from "@/types";

type ExtendedStatus = Status | "Voluntario";

const styles: Record<ExtendedStatus, { bg: string; text: string; label: string }> = {
  APROBADA:    { bg: "bg-tertiary-fixed",          text: "text-on-tertiary-fixed",    label: "Aprobada" },
  PENDIENTE:   { bg: "bg-orange-100",              text: "text-orange-600",           label: "Pendiente" },
  RECHAZADA:   { bg: "bg-error-container",         text: "text-on-error-container",   label: "Rechazada" },
  CANCELADA:   { bg: "bg-surface-container-high",  text: "text-on-surface-variant",   label: "Cancelada" },
  Voluntario:  { bg: "bg-tertiary-fixed",          text: "text-on-tertiary-fixed",    label: "Voluntario" },
};

export default function StatusChip({ status }: { status: ExtendedStatus }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  );
}
