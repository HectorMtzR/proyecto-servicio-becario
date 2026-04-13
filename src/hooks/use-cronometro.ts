"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve los segundos transcurridos desde `startTime` (ISO string), actualizando cada segundo.
 * Retorna 0 si startTime es null. La fuente de verdad es el timestamp del servidor.
 */
export function useCronometro(startTime: string | null): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const start = new Date(startTime).getTime();
    const compute = () => {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsed(diff);
    };

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return elapsed;
}

export function formatHMS(totalSeconds: number): { hm: string; ss: string } {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return { hm: `${pad(h)}:${pad(m)}`, ss: pad(s) };
}
