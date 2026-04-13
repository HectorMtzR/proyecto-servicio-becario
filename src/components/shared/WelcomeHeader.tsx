"use client";

import { useEffect, useState } from "react";

function getGreeting(hour: number) {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

const DAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatDate(d: Date) {
  const day = DAYS[d.getDay()];
  const month = MONTHS[d.getMonth()];
  return `${day.charAt(0).toUpperCase() + day.slice(1)}, ${d.getDate()} de ${month} de ${d.getFullYear()}`;
}

function formatTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function WelcomeHeader({ name }: { name: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const greeting = now ? getGreeting(now.getHours()) : "Hola";

  return (
    <div className="flex flex-col gap-6 rounded-xl bg-zinc-900 p-8 text-white shadow-[0_4px_32px_rgba(25,28,29,0.12)] md:flex-row md:items-end md:justify-between">
      <div>
        <span className="font-label text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          {greeting}
        </span>
        <h1 className="mt-2 font-headline text-3xl font-black tracking-tight md:text-4xl">
          {name}
        </h1>
        <p className="mt-2 text-sm text-zinc-300">
          {now ? formatDate(now) : "\u00a0"}
        </p>
      </div>
      <div className="text-right">
        <span className="font-label text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          Hora actual
        </span>
        <p className="mt-1 font-headline text-4xl font-black tracking-tighter tabular-nums text-white md:text-5xl">
          {now ? formatTime(now) : "--:--:--"}
        </p>
      </div>
    </div>
  );
}
