export default function AyudaPage() {
  return (
    <section className="p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Centro de ayuda
          </h1>
          <p className="mt-2 text-secondary">
            Encuentra respuestas o contacta al equipo de soporte.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <HelpCard
            icon="menu_book"
            title="Guía de uso"
            description="Aprende a registrar jornadas y consultar tu progreso."
          />
          <HelpCard
            icon="quiz"
            title="Preguntas frecuentes"
            description="Respuestas rápidas a las dudas más comunes."
          />
          <HelpCard
            icon="mail"
            title="Contactar a soporte"
            description="Escríbenos a soporte@anahuac.mx y te respondemos en 24h."
          />
          <HelpCard
            icon="bug_report"
            title="Reportar un problema"
            description="Ayúdanos a mejorar reportando errores o sugerencias."
          />
        </div>

        <div className="rounded-xl bg-zinc-900 p-6 text-white">
          <h2 className="font-headline text-lg font-bold">¿Necesitas ayuda inmediata?</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Acércate a la Coordinación de Servicio Becario en horario de oficina
            (lunes a viernes, 9:00 — 17:00).
          </p>
        </div>
      </div>
    </section>
  );
}

function HelpCard({
  icon,
  title,
  description,
}: {
  icon:        string;
  title:       string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_4px_32px_rgba(25,28,29,0.06)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
          {icon}
        </span>
      </div>
      <h2 className="font-headline text-base font-bold text-on-surface">{title}</h2>
      <p className="mt-1 text-sm text-secondary">{description}</p>
    </div>
  );
}
