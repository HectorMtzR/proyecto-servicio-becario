export default function MetricCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon:   string;
  label:  string;
  value:  string | number;
  hint?:  string;
  tone?:  "default" | "primary" | "tertiary" | "error";
}) {
  const toneClasses: Record<typeof tone & string, string> = {
    default:   "text-on-surface",
    primary:   "text-primary",
    tertiary:  "text-tertiary",
    error:     "text-error",
  };

  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_4px_32px_rgba(25,28,29,0.06)]">
      <div className="flex items-center justify-between">
        <span className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary">
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-low">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
            {icon}
          </span>
        </div>
      </div>
      <p className={`mt-4 font-headline text-3xl font-black tracking-tight ${toneClasses[tone]}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-secondary">{hint}</p>}
    </div>
  );
}
