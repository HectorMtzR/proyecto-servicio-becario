"use client";

interface Props {
  open:        boolean;
  title:       string;
  message:     string;
  confirmText?: string;
  cancelText?:  string;
  tone?:        "danger" | "primary";
  isPending?:   boolean;
  onConfirm:    () => void;
  onCancel:     () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText  = "Cancelar",
  tone        = "primary",
  isPending   = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-error text-white hover:bg-error/90"
      : "bg-primary-container text-on-primary-container shadow-btn-primary hover:-translate-y-0.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      onClick={() => !isPending && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-xl bg-surface-container-lowest p-8 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-headline text-xl font-black tracking-tight text-on-surface">
          {title}
        </h2>
        <p className="mb-6 text-sm text-secondary">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl px-5 py-3 text-sm font-bold text-secondary transition-all hover:bg-surface-container-low disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`rounded-xl px-6 py-3 text-sm font-bold transition-all active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${confirmClass}`}
          >
            {isPending ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
