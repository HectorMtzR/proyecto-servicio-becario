"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rechazarJornadaAction } from "@/actions/validaciones";

interface Props {
  open:        boolean;
  onClose:     () => void;
  sessionId:   string | null;
  studentName: string;
}

export default function RejectDialog({ open, onClose, sessionId, studentName }: Props) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open || !sessionId) return null;

  const trimmed = comment.trim();
  const canSubmit = trimmed.length >= 10 && trimmed.length <= 500;

  function handleSubmit() {
    if (!sessionId || !canSubmit) return;
    startTransition(async () => {
      const res = await rechazarJornadaAction(sessionId, comment);
      if (!res.success) {
        toast.error(res.error ?? "No se pudo rechazar la jornada");
        return;
      }
      toast.success("Jornada rechazada");
      setComment("");
      onClose();
      router.refresh();
    });
  }

  function handleClose() {
    if (isPending) return;
    setComment("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-surface-container-lowest p-8 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-headline text-2xl font-black tracking-tight text-on-surface">
          Rechazar Jornada
        </h2>
        <p className="mb-6 text-sm text-secondary">
          Explica a <span className="font-bold text-on-surface">{studentName}</span> por
          qué rechazas esta jornada. El comentario es obligatorio (mínimo 10 caracteres).
        </p>

        <label
          htmlFor="rejection-comment"
          className="mb-2 block font-label text-xs font-bold uppercase tracking-widest text-secondary"
        >
          Motivo del rechazo
        </label>
        <textarea
          id="rejection-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe por qué rechazas esta jornada..."
          disabled={isPending}
          maxLength={500}
          className="w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary-container/30"
        />
        <div className="mt-2 flex justify-between text-xs text-secondary">
          <span>Mínimo 10 caracteres</span>
          <span>{trimmed.length} / 500</span>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="rounded-xl px-5 py-3 text-sm font-bold text-secondary transition-all hover:bg-surface-container-low disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className="rounded-xl bg-error px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isPending ? "Rechazando..." : "Rechazar Jornada"}
          </button>
        </div>
      </div>
    </div>
  );
}
