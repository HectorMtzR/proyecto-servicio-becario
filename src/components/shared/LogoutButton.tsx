"use client";

import { useState, useTransition } from "react";
import { logoutAction } from "@/actions/auth";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className, children }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      <ConfirmDialog
        open={open}
        title="Cerrar sesión"
        message="¿Seguro que quieres cerrar tu sesión actual?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        tone="danger"
        isPending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
