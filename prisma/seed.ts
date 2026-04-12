import { PrismaClient, Role, Status } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Limpiar datos existentes ──────────────────────────────────────────────
  await prisma.workSession.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.career.deleteMany();
  await prisma.period.deleteMany();

  // ─── Carreras ──────────────────────────────────────────────────────────────
  const careerSistemas = await prisma.career.create({
    data: { name: "Ingeniería en Sistemas Computacionales", faculty: "Facultad de Ingeniería" },
  });

  const careerAdmin = await prisma.career.create({
    data: { name: "Administración de Empresas", faculty: "Facultad de Economía y Negocios" },
  });

  const careerDerecho = await prisma.career.create({
    data: { name: "Derecho", faculty: "Facultad de Derecho" },
  });

  console.log("✅ Carreras creadas");

  // ─── Período activo ────────────────────────────────────────────────────────
  const period = await prisma.period.create({
    data: {
      name:      "Agosto - Diciembre 2024",
      startDate: new Date("2024-08-12T00:00:00.000-06:00"),
      endDate:   new Date("2024-12-13T00:00:00.000-06:00"),
      isActive:  true,
      isClosed:  false,
    },
  });

  console.log("✅ Período creado");

  // ─── Hash de contraseñas ───────────────────────────────────────────────────
  const adminHash  = await bcrypt.hash("Admin123!", 12);
  const jefeHash   = await bcrypt.hash("Jefe123!",  12);
  const alumnoHash = await bcrypt.hash("Alumno123!", 12);

  // ─── Admin ─────────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email:              "admin@anahuac.mx",
      name:               "Administrador Sistema",
      passwordHash:       adminHash,
      role:               Role.ADMIN,
      mustChangePassword: false,
      isActive:           true,
    },
  });

  // ─── Jefes ─────────────────────────────────────────────────────────────────
  const jefe1 = await prisma.user.create({
    data: {
      email:              "jefe1@anahuac.mx",
      name:               "Ing. Carlos Martínez",
      passwordHash:       jefeHash,
      role:               Role.JEFE_SERVICIO,
      mustChangePassword: false,
      isActive:           true,
    },
  });

  const jefe2 = await prisma.user.create({
    data: {
      email:              "jefe2@anahuac.mx",
      name:               "Lic. María González",
      passwordHash:       jefeHash,
      role:               Role.JEFE_SERVICIO,
      mustChangePassword: false,
      isActive:           true,
    },
  });

  console.log("✅ Usuarios admin y jefes creados");

  // ─── Alumnos ───────────────────────────────────────────────────────────────
  const alumno1 = await prisma.user.create({
    data: {
      email:              "alumno1@anahuac.mx",
      name:               "Ana Ramírez López",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: false,
      isActive:           true,
    },
  });

  const alumno2 = await prisma.user.create({
    data: {
      email:              "alumno2@anahuac.mx",
      name:               "Luis Hernández Torres",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: false,
      isActive:           true,
    },
  });

  const alumno3 = await prisma.user.create({
    data: {
      email:              "alumno3@anahuac.mx",
      name:               "Sofía Castro Vega",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: false,
      isActive:           true,
    },
  });

  const alumno4 = await prisma.user.create({
    data: {
      email:              "alumno4@anahuac.mx",
      name:               "Diego Morales Ruiz",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: false,
      isActive:           true,
    },
  });

  const alumno5 = await prisma.user.create({
    data: {
      email:              "alumno5@anahuac.mx",
      name:               "Valentina Soto Pérez",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: false,
      isActive:           true,
    },
  });

  console.log("✅ Alumnos creados");

  // ─── Perfiles de alumno ────────────────────────────────────────────────────
  await prisma.studentProfile.create({
    data: {
      userId:             alumno1.id,
      careerId:           careerSistemas.id,
      studentId:          "A00001234",
      semester:           6,
      enrollmentYear:     2022,
      scholarshipPercent: 80,
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId:             alumno2.id,
      careerId:           careerSistemas.id,
      studentId:          "A00001235",
      semester:           4,
      enrollmentYear:     2023,
      scholarshipPercent: 50,
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId:             alumno3.id,
      careerId:           careerAdmin.id,
      studentId:          "A00001236",
      semester:           5,
      enrollmentYear:     2022,
      scholarshipPercent: 30,
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId:             alumno4.id,
      careerId:           careerAdmin.id,
      studentId:          "A00001237",
      semester:           8,
      enrollmentYear:     2021,
      scholarshipPercent: 100,
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId:             alumno5.id,
      careerId:           careerDerecho.id,
      studentId:          "A00001238",
      semester:           3,
      enrollmentYear:     2024,
      scholarshipPercent: 25,
    },
  });

  console.log("✅ Perfiles de alumno creados");

  // ─── Assignments ───────────────────────────────────────────────────────────
  // alumno1-3 → jefe1 (Laboratorios TI)
  const assign1 = await prisma.assignment.create({
    data: {
      studentId:          alumno1.id,
      supervisorId:       jefe1.id,
      periodId:           period.id,
      department:         "Laboratorios TI",
      targetHours:        80,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  const assign2 = await prisma.assignment.create({
    data: {
      studentId:          alumno2.id,
      supervisorId:       jefe1.id,
      periodId:           period.id,
      department:         "Laboratorios TI",
      targetHours:        50,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  const assign3 = await prisma.assignment.create({
    data: {
      studentId:          alumno3.id,
      supervisorId:       jefe1.id,
      periodId:           period.id,
      department:         "Coordinación Académica",
      targetHours:        30,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  // alumno4-5 → jefe2
  const assign4 = await prisma.assignment.create({
    data: {
      studentId:          alumno4.id,
      supervisorId:       jefe2.id,
      periodId:           period.id,
      department:         "Coordinación Académica",
      targetHours:        100,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  const assign5 = await prisma.assignment.create({
    data: {
      studentId:          alumno5.id,
      supervisorId:       jefe2.id,
      periodId:           period.id,
      department:         "Bufete Jurídico",
      targetHours:        25,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  console.log("✅ Assignments creados");

  // ─── Jornadas de ejemplo ───────────────────────────────────────────────────

  // Alumno 1 — 3 jornadas aprobadas (total: 390 min = 6.5h)
  await prisma.workSession.create({
    data: {
      assignmentId: assign1.id,
      studentId:    alumno1.id,
      startTime:    new Date("2024-08-20T09:00:00.000-06:00"),
      endTime:      new Date("2024-08-20T11:00:00.000-06:00"),
      totalMinutes: 120,
      status:       Status.APROBADA,
      isManual:     false,
      description:  "Soporte técnico a equipos del laboratorio de cómputo. Instalación de software y actualización de sistemas.",
      validatedBy:  jefe1.id,
      validatedAt:  new Date("2024-08-21T10:00:00.000-06:00"),
    },
  });

  await prisma.workSession.create({
    data: {
      assignmentId: assign1.id,
      studentId:    alumno1.id,
      startTime:    new Date("2024-08-22T14:00:00.000-06:00"),
      endTime:      new Date("2024-08-22T16:30:00.000-06:00"),
      totalMinutes: 150,
      status:       Status.APROBADA,
      isManual:     false,
      description:  "Mantenimiento preventivo de equipos en sala B. Limpieza de hardware y pruebas de rendimiento.",
      validatedBy:  jefe1.id,
      validatedAt:  new Date("2024-08-23T09:00:00.000-06:00"),
    },
  });

  // Jornada manual aprobada
  await prisma.workSession.create({
    data: {
      assignmentId: assign1.id,
      studentId:    alumno1.id,
      startTime:    new Date("2024-08-26T10:00:00.000-06:00"),
      endTime:      new Date("2024-08-26T12:00:00.000-06:00"),
      totalMinutes: 120,
      status:       Status.APROBADA,
      isManual:     true,
      description:  "Apoyo en configuración de red WiFi en aula 204. Diagnóstico y resolución de problemas de conectividad.",
      validatedBy:  jefe1.id,
      validatedAt:  new Date("2024-08-27T08:00:00.000-06:00"),
    },
  });

  // Actualizar acumulado del assignment 1
  await prisma.assignment.update({
    where: { id: assign1.id },
    data:  { accumulatedMinutes: 390 },
  });

  // Alumno 1 — 1 jornada pendiente
  await prisma.workSession.create({
    data: {
      assignmentId: assign1.id,
      studentId:    alumno1.id,
      startTime:    new Date("2024-09-02T09:00:00.000-06:00"),
      endTime:      new Date("2024-09-02T11:00:00.000-06:00"),
      totalMinutes: 120,
      status:       Status.PENDIENTE,
      isManual:     false,
      description:  "Inventario de equipo de cómputo en laboratorio principal. Registro de número de serie y estado de cada equipo.",
    },
  });

  // Alumno 1 — 1 jornada rechazada
  await prisma.workSession.create({
    data: {
      assignmentId:    assign1.id,
      studentId:       alumno1.id,
      startTime:       new Date("2024-08-28T08:00:00.000-06:00"),
      endTime:         new Date("2024-08-28T08:20:00.000-06:00"),
      totalMinutes:    20,
      status:          Status.RECHAZADA,
      isManual:        false,
      description:     "Apoyo en laboratorio.",
      rejectionComment: "La descripción de actividades es insuficiente. Por favor detalla las tareas realizadas con más especificidad.",
      validatedBy:     jefe1.id,
      validatedAt:     new Date("2024-08-29T09:00:00.000-06:00"),
    },
  });

  // Alumno 2 — 2 jornadas aprobadas (total: 210 min = 3.5h)
  await prisma.workSession.create({
    data: {
      assignmentId: assign2.id,
      studentId:    alumno2.id,
      startTime:    new Date("2024-08-19T08:00:00.000-06:00"),
      endTime:      new Date("2024-08-19T09:30:00.000-06:00"),
      totalMinutes: 90,
      status:       Status.APROBADA,
      isManual:     false,
      description:  "Instalación de actualizaciones de seguridad en servidores del laboratorio. Verificación de funcionamiento post-actualización.",
      validatedBy:  jefe1.id,
      validatedAt:  new Date("2024-08-20T08:00:00.000-06:00"),
    },
  });

  await prisma.workSession.create({
    data: {
      assignmentId: assign2.id,
      studentId:    alumno2.id,
      startTime:    new Date("2024-08-23T13:00:00.000-06:00"),
      endTime:      new Date("2024-08-23T15:00:00.000-06:00"),
      totalMinutes: 120,
      status:       Status.APROBADA,
      isManual:     false,
      description:  "Apoyo técnico a alumnos de primer semestre en manejo de herramientas de desarrollo. Instalación de IDEs.",
      validatedBy:  jefe1.id,
      validatedAt:  new Date("2024-08-24T09:00:00.000-06:00"),
    },
  });

  await prisma.assignment.update({
    where: { id: assign2.id },
    data:  { accumulatedMinutes: 210 },
  });

  // Alumno 3 — 1 jornada aprobada (90 min = 1.5h)
  await prisma.workSession.create({
    data: {
      assignmentId: assign3.id,
      studentId:    alumno3.id,
      startTime:    new Date("2024-08-21T10:00:00.000-06:00"),
      endTime:      new Date("2024-08-21T11:30:00.000-06:00"),
      totalMinutes: 90,
      status:       Status.APROBADA,
      isManual:     false,
      description:  "Apoyo en organización de documentación académica del semestre anterior. Digitalización de expedientes físicos.",
      validatedBy:  jefe1.id,
      validatedAt:  new Date("2024-08-22T08:00:00.000-06:00"),
    },
  });

  await prisma.assignment.update({
    where: { id: assign3.id },
    data:  { accumulatedMinutes: 90 },
  });

  // Alumno 4 — 2 jornadas aprobadas (total: 270 min = 4.5h)
  await prisma.workSession.create({
    data: {
      assignmentId: assign4.id,
      studentId:    alumno4.id,
      startTime:    new Date("2024-08-20T08:00:00.000-06:00"),
      endTime:      new Date("2024-08-20T10:30:00.000-06:00"),
      totalMinutes: 150,
      status:       Status.APROBADA,
      isManual:     false,
      description:  "Apoyo en coordinación de eventos académicos del semestre. Elaboración de material de difusión y organización de agenda.",
      validatedBy:  jefe2.id,
      validatedAt:  new Date("2024-08-21T09:00:00.000-06:00"),
    },
  });

  await prisma.workSession.create({
    data: {
      assignmentId: assign4.id,
      studentId:    alumno4.id,
      startTime:    new Date("2024-08-27T09:00:00.000-06:00"),
      endTime:      new Date("2024-08-27T10:00:00.000-06:00"),
      totalMinutes: 60,
      status:       Status.APROBADA,
      isManual:     true,
      description:  "Registro manual: apoyo en recepción de alumnos de nuevo ingreso en coordinación académica.",
      validatedBy:  jefe2.id,
      validatedAt:  new Date("2024-08-28T08:00:00.000-06:00"),
    },
  });

  await prisma.assignment.update({
    where: { id: assign4.id },
    data:  { accumulatedMinutes: 210 },
  });

  // Alumno 4 — jornada pendiente
  await prisma.workSession.create({
    data: {
      assignmentId: assign4.id,
      studentId:    alumno4.id,
      startTime:    new Date("2024-09-02T10:00:00.000-06:00"),
      endTime:      new Date("2024-09-02T12:00:00.000-06:00"),
      totalMinutes: 120,
      status:       Status.PENDIENTE,
      isManual:     false,
      description:  "Actualización de base de datos de contactos de alumnos. Verificación y corrección de información de expedientes.",
    },
  });

  // Alumno 5 — 1 jornada aprobada (60 min = 1h), 1 cancelada
  await prisma.workSession.create({
    data: {
      assignmentId: assign5.id,
      studentId:    alumno5.id,
      startTime:    new Date("2024-08-22T09:00:00.000-06:00"),
      endTime:      new Date("2024-08-22T10:00:00.000-06:00"),
      totalMinutes: 60,
      status:       Status.APROBADA,
      isManual:     false,
      description:  "Apoyo en búsqueda y organización de jurisprudencia para casos activos del bufete. Catalogación en sistema digital.",
      validatedBy:  jefe2.id,
      validatedAt:  new Date("2024-08-23T09:00:00.000-06:00"),
    },
  });

  await prisma.assignment.update({
    where: { id: assign5.id },
    data:  { accumulatedMinutes: 60 },
  });

  await prisma.workSession.create({
    data: {
      assignmentId: assign5.id,
      studentId:    alumno5.id,
      startTime:    new Date("2024-08-26T14:00:00.000-06:00"),
      endTime:      new Date("2024-08-26T15:00:00.000-06:00"),
      totalMinutes: 60,
      status:       Status.CANCELADA,
      isManual:     false,
      description:  "Jornada cancelada por el alumno.",
    },
  });

  console.log("✅ Jornadas de ejemplo creadas");
  console.log("");
  console.log("🎉 Seed completado exitosamente.");
  console.log("");
  console.log("Credenciales:");
  console.log("  Admin:   admin@anahuac.mx  / Admin123!");
  console.log("  Jefe 1:  jefe1@anahuac.mx  / Jefe123!");
  console.log("  Jefe 2:  jefe2@anahuac.mx  / Jefe123!");
  console.log("  Alumno 1: alumno1@anahuac.mx / Alumno123! (80%, 6.5h acumuladas)");
  console.log("  Alumno 2: alumno2@anahuac.mx / Alumno123! (50%, 3.5h acumuladas)");
  console.log("  Alumno 3: alumno3@anahuac.mx / Alumno123! (30%, 1.5h acumuladas)");
  console.log("  Alumno 4: alumno4@anahuac.mx / Alumno123! (100%, 3.5h acumuladas)");
  console.log("  Alumno 5: alumno5@anahuac.mx / Alumno123! (25%, 1h acumulada)");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
