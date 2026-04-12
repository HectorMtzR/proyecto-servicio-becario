# docs/design/ — Referencia Visual

## Archivos en esta carpeta

```
docs/design/
├── DESIGN.md     ← Design system completo (Material Design 3 tokens, filosofía, do's & don'ts)
├── code.html     ← HTML de referencia del dashboard alumno (Stitch)
├── screen.png    ← Screenshot del dashboard alumno
└── README.md     ← Este archivo
```

## Uso con Claude Code

El HTML y la imagen son referencia visual, NO código de producción. La implementación usa Next.js + shadcn/ui + los tokens definidos en CLAUDE.md.

Para implementar una pantalla:
> "Implementa el dashboard del alumno. Revisa docs/design/screen.png y docs/design/code.html como referencia visual."

Las pantallas sin mockup (login, jefe, admin) deben seguir la misma línea visual: misma paleta, Manrope + Inter, arquitectura tonal, regla no-line.

## Notas

- Las horas mostradas en el mockup (480 requeridas) son de un modelo anterior. La meta real es igual al porcentaje de beca del alumno.
- Los textos del mockup están en inglés (Home, My Shifts) — la implementación va 100% en español.
- La barra de búsqueda y los íconos de notificaciones del mockup no se implementan en el MVP.
- "Submit Report" del mockup se implementa como "Registrar Jornada" (registro manual).