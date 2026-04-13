export default function ConfiguracionPage() {
  return (
    <section className="p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Configuración
          </h1>
          <p className="mt-2 text-secondary">
            Ajusta las preferencias de tu cuenta.
          </p>
        </div>

        <div className="space-y-4">
          <SettingCard
            icon="lock"
            title="Seguridad"
            description="Cambia tu contraseña y gestiona el acceso a tu cuenta."
          />
          <SettingCard
            icon="notifications"
            title="Notificaciones"
            description="Elige cómo quieres recibir avisos del sistema."
          />
          <SettingCard
            icon="palette"
            title="Apariencia"
            description="Personaliza el tema y la densidad de la interfaz."
          />
          <SettingCard
            icon="language"
            title="Idioma y región"
            description="Ajusta idioma, zona horaria y formato de fecha."
          />
        </div>
      </div>
    </section>
  );
}

function SettingCard({
  icon,
  title,
  description,
}: {
  icon:        string;
  title:       string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-[0_4px_32px_rgba(25,28,29,0.06)]">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container-low">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
          {icon}
        </span>
      </div>
      <div className="flex-1">
        <h2 className="font-headline text-base font-bold text-on-surface">{title}</h2>
        <p className="mt-1 text-sm text-secondary">{description}</p>
      </div>
      <span className="material-symbols-outlined mt-1 text-secondary">chevron_right</span>
    </div>
  );
}
