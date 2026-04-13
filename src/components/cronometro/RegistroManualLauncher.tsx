"use client";

import { useUIStore } from "@/stores/ui-store";
import RegistroManualModal from "./RegistroManualModal";

export default function RegistroManualLauncher({
  hasAssignment,
}: {
  hasAssignment: boolean;
}) {
  const open  = useUIStore((s) => s.registroManualOpen);
  const openIt  = useUIStore((s) => s.openRegistroManual);
  const closeIt = useUIStore((s) => s.closeRegistroManual);

  return (
    <>
      <button
        type="button"
        onClick={openIt}
        aria-label="Registrar jornada manual"
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-fab transition-all hover:scale-110 active:scale-95"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          add
        </span>
      </button>

      <RegistroManualModal
        open={open}
        onClose={closeIt}
        hasAssignment={hasAssignment}
      />
    </>
  );
}
