"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { resetPasswordAction } from "@/actions/usuarios";

interface Props {
  user: { id: string; name: string };
  open: boolean;
  onClose: () => void;
}

export default function ResetPasswordModal({ user, open, onClose }: Props) {
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTempPassword(null);
      return;
    }
    setLoading(true);
    resetPasswordAction(user.id).then((res) => {
      setLoading(false);
      if (!res.success || !res.data) {
        toast.error(res.error ?? "No se pudo resetear la contraseña");
        onClose();
        return;
      }
      setTempPassword(res.data.tempPassword);
    });
  }, [open, user.id, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-8 shadow-card">
        <h2 className="mb-1 font-headline text-xl font-black tracking-tight text-on-surface">
          Resetear contraseña
        </h2>
        <p className="mb-6 text-sm text-secondary">{user.name}</p>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary-container">
              progress_activity
            </span>
            <p className="text-sm text-secondary">Generando contraseña temporal…</p>
          </div>
        ) : tempPassword ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-surface-container-low p-4 text-center">
              <code className="font-mono text-2xl text-on-surface select-all">{tempPassword}</code>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(tempPassword);
                toast.success("Contraseña copiada al portapapeles");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-3 text-sm font-bold text-on-surface transition-all hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              Copiar al portapapeles
            </button>

            <p className="rounded-xl bg-error-container/30 p-4 text-xs leading-relaxed text-on-error-container">
              Esta contraseña temporal se muestra una sola vez. Comunícala a{" "}
              <strong>{user.name}</strong> en persona. Deberá cambiarla en su próximo inicio de
              sesión.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-xl bg-primary-container px-4 py-3 text-sm font-bold text-on-primary shadow-btn-primary transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Cerrar
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
