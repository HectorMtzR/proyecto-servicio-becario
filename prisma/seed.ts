import { PrismaClient, Role, ScholarshipType, Status } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database (modo seguro — no borra datos existentes)...");

  // ─── Carreras ──────────────────────────────────────────────────────────────
  // Carreras de demo (usadas por los usuarios de prueba)
  const careerSistemas = await prisma.career.upsert({
    where:  { name: "Ingeniería en Sistemas Computacionales" },
    update: {},
    create: { name: "Ingeniería en Sistemas Computacionales", faculty: "Facultad de Ingeniería" },
  });

  const careerAdmin = await prisma.career.upsert({
    where:  { name: "Administración de Empresas" },
    update: {},
    create: { name: "Administración de Empresas", faculty: "Facultad de Economía y Negocios" },
  });

  const careerDerecho = await prisma.career.upsert({
    where:  { name: "Derecho" },
    update: { faculty: "Escuela de Derecho" },
    create: { name: "Derecho", faculty: "Escuela de Derecho" },
  });

  // Catálogo institucional de carreras
  const institutionalCareers: { name: string; faculty: string }[] = [
    { name: "Comunicación",                                                    faculty: "Escuela de Comunicación" },
    { name: "Diseño Multimedia",                                               faculty: "Escuela de Diseño" },
    { name: "Diseño Industrial",                                               faculty: "Escuela de Diseño" },
    { name: "Diseño de Moda e Innovación",                                     faculty: "Escuela de Diseño" },
    { name: "Diseño Gráfico",                                                  faculty: "Escuela de Diseño" },
    { name: "Ingeniería Civil",                                                faculty: "Escuela de Ingeniería" },
    { name: "Ingeniería Industrial para la Dirección",                         faculty: "Escuela de Ingeniería" },
    { name: "Ingeniería Mecatrónica",                                          faculty: "Escuela de Ingeniería" },
    { name: "Ingeniería en Tecnologías de la Información y Negocios Digitales", faculty: "Escuela de Ingeniería" },
    { name: "Ingeniería Biomédica",                                            faculty: "Escuela de Ingeniería" },
    { name: "Médico Cirujano",                                                 faculty: "Escuela de Medicina" },
    { name: "Finanzas y Contaduría Pública",                                   faculty: "Facultad de Negocios" },
    { name: "Administración y Dirección de Empresas",                          faculty: "Facultad de Negocios" },
    { name: "Mercadotecnia Estratégica",                                       faculty: "Facultad de Negocios" },
    { name: "Negocios Internacionales",                                        faculty: "Facultad de Negocios" },
    { name: "Psicología",                                                      faculty: "Escuela de Psicología" },
  ];

  for (const c of institutionalCareers) {
    await prisma.career.upsert({
      where:  { name: c.name },
      update: { faculty: c.faculty },
      create: c,
    });
  }

  console.log("✅ Carreras verificadas");

  // ─── Período activo ────────────────────────────────────────────────────────
  const period = await prisma.period.upsert({
    where:  { name: "Agosto - Diciembre 2024" },
    update: {},
    create: {
      name:      "Agosto - Diciembre 2024",
      startDate: new Date("2024-08-12T00:00:00.000-06:00"),
      endDate:   new Date("2024-12-13T00:00:00.000-06:00"),
      isActive:  true,
      isClosed:  false,
    },
  });

  console.log("✅ Período verificado");

  // ─── Hash de contraseñas ───────────────────────────────────────────────────
  const adminHash  = await bcrypt.hash("Admin123!", 12);
  const jefeHash   = await bcrypt.hash("Jefe123!",  12);
  const alumnoHash = await bcrypt.hash("Alumno123!", 12);

  // ─── Admin ─────────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where:  { email: "admin@anahuac.mx" },
    update: {},
    create: {
      email:              "admin@anahuac.mx",
      name:               "Administrador Sistema",
      passwordHash:       adminHash,
      role:               Role.ADMIN,
      mustChangePassword: false,
      isActive:           true,
    },
  });

  // ─── Jefes ─────────────────────────────────────────────────────────────────
  const jefe1 = await prisma.user.upsert({
    where:  { email: "jefe1@anahuac.mx" },
    update: {},
    create: {
      email:              "jefe1@anahuac.mx",
      name:               "Ing. Carlos Martínez",
      passwordHash:       jefeHash,
      role:               Role.JEFE_SERVICIO,
      mustChangePassword: true,
      isActive:           true,
    },
  });

  const jefe2 = await prisma.user.upsert({
    where:  { email: "jefe2@anahuac.mx" },
    update: {},
    create: {
      email:              "jefe2@anahuac.mx",
      name:               "Lic. María González",
      passwordHash:       jefeHash,
      role:               Role.JEFE_SERVICIO,
      mustChangePassword: true,
      isActive:           true,
    },
  });

  console.log("✅ Usuarios admin y jefes verificados");

  // ─── Alumnos ───────────────────────────────────────────────────────────────
  const alumno1 = await prisma.user.upsert({
    where:  { email: "alumno1@anahuac.mx" },
    update: {},
    create: {
      email:              "alumno1@anahuac.mx",
      name:               "Ana Ramírez López",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: true,
      isActive:           true,
    },
  });

  const alumno2 = await prisma.user.upsert({
    where:  { email: "alumno2@anahuac.mx" },
    update: {},
    create: {
      email:              "alumno2@anahuac.mx",
      name:               "Luis Hernández Torres",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: true,
      isActive:           true,
    },
  });

  const alumno3 = await prisma.user.upsert({
    where:  { email: "alumno3@anahuac.mx" },
    update: {},
    create: {
      email:              "alumno3@anahuac.mx",
      name:               "Sofía Castro Vega",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: true,
      isActive:           true,
    },
  });

  const alumno4 = await prisma.user.upsert({
    where:  { email: "alumno4@anahuac.mx" },
    update: {},
    create: {
      email:              "alumno4@anahuac.mx",
      name:               "Diego Morales Ruiz",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: true,
      isActive:           true,
    },
  });

  const alumno5 = await prisma.user.upsert({
    where:  { email: "alumno5@anahuac.mx" },
    update: {},
    create: {
      email:              "alumno5@anahuac.mx",
      name:               "Valentina Soto Pérez",
      passwordHash:       alumnoHash,
      role:               Role.ALUMNO,
      mustChangePassword: true,
      isActive:           true,
    },
  });

  console.log("✅ Alumnos verificados");

  // ─── Perfiles de alumno ────────────────────────────────────────────────────
  await prisma.studentProfile.upsert({
    where:  { userId: alumno1.id },
    update: {},
    create: {
      userId:             alumno1.id,
      careerId:           careerSistemas.id,
      studentId:          "A00001234",
      semester:           6,
      enrollmentYear:     2022,
      scholarshipPercent: 80,
      scholarshipType:    ScholarshipType.ACADEMICA,
    },
  });

  await prisma.studentProfile.upsert({
    where:  { userId: alumno2.id },
    update: {},
    create: {
      userId:             alumno2.id,
      careerId:           careerSistemas.id,
      studentId:          "A00001235",
      semester:           4,
      enrollmentYear:     2023,
      scholarshipPercent: 50,
      scholarshipType:    ScholarshipType.EXCELENCIA,
    },
  });

  await prisma.studentProfile.upsert({
    where:  { userId: alumno3.id },
    update: {},
    create: {
      userId:             alumno3.id,
      careerId:           careerAdmin.id,
      studentId:          "A00001236",
      semester:           5,
      enrollmentYear:     2022,
      scholarshipPercent: 30,
      scholarshipType:    ScholarshipType.SEP,
    },
  });

  await prisma.studentProfile.upsert({
    where:  { userId: alumno4.id },
    update: {},
    create: {
      userId:             alumno4.id,
      careerId:           careerAdmin.id,
      studentId:          "A00001237",
      semester:           8,
      enrollmentYear:     2021,
      scholarshipPercent: 100,
      scholarshipType:    ScholarshipType.DEPORTIVA,
    },
  });

  await prisma.studentProfile.upsert({
    where:  { userId: alumno5.id },
    update: {},
    create: {
      userId:             alumno5.id,
      careerId:           careerDerecho.id,
      studentId:          "A00001238",
      semester:           3,
      enrollmentYear:     2024,
      scholarshipPercent: 25,
      scholarshipType:    ScholarshipType.CULTURAL,
    },
  });

  console.log("✅ Perfiles de alumno verificados");

  // ─── Assignments ───────────────────────────────────────────────────────────
  const assign1 = await prisma.assignment.upsert({
    where:  { studentId_periodId: { studentId: alumno1.id, periodId: period.id } },
    update: {},
    create: {
      studentId:          alumno1.id,
      supervisorId:       jefe1.id,
      periodId:           period.id,
      department:         "Laboratorios TI",
      targetHours:        80,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  const assign2 = await prisma.assignment.upsert({
    where:  { studentId_periodId: { studentId: alumno2.id, periodId: period.id } },
    update: {},
    create: {
      studentId:          alumno2.id,
      supervisorId:       jefe1.id,
      periodId:           period.id,
      department:         "Laboratorios TI",
      targetHours:        50,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  const assign3 = await prisma.assignment.upsert({
    where:  { studentId_periodId: { studentId: alumno3.id, periodId: period.id } },
    update: {},
    create: {
      studentId:          alumno3.id,
      supervisorId:       jefe1.id,
      periodId:           period.id,
      department:         "Coordinación Académica",
      targetHours:        30,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  const assign4 = await prisma.assignment.upsert({
    where:  { studentId_periodId: { studentId: alumno4.id, periodId: period.id } },
    update: {},
    create: {
      studentId:          alumno4.id,
      supervisorId:       jefe2.id,
      periodId:           period.id,
      department:         "Coordinación Académica",
      targetHours:        100,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  const assign5 = await prisma.assignment.upsert({
    where:  { studentId_periodId: { studentId: alumno5.id, periodId: period.id } },
    update: {},
    create: {
      studentId:          alumno5.id,
      supervisorId:       jefe2.id,
      periodId:           period.id,
      department:         "Bufete Jurídico",
      targetHours:        25,
      accumulatedMinutes: 0,
      isActive:           true,
    },
  });

  console.log("✅ Assignments verificados");

  // ─── Jornadas de ejemplo (solo si el assignment no tiene ninguna) ───────────
  const [count1, count2, count3, count4, count5] = await Promise.all([
    prisma.workSession.count({ where: { assignmentId: assign1.id } }),
    prisma.workSession.count({ where: { assignmentId: assign2.id } }),
    prisma.workSession.count({ where: { assignmentId: assign3.id } }),
    prisma.workSession.count({ where: { assignmentId: assign4.id } }),
    prisma.workSession.count({ where: { assignmentId: assign5.id } }),
  ]);

  if (count1 === 0) {
    await prisma.workSession.createMany({
      data: [
        {
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
        {
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
        {
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
        {
          assignmentId: assign1.id,
          studentId:    alumno1.id,
          startTime:    new Date("2024-09-02T09:00:00.000-06:00"),
          endTime:      new Date("2024-09-02T11:00:00.000-06:00"),
          totalMinutes: 120,
          status:       Status.PENDIENTE,
          isManual:     false,
          description:  "Inventario de equipo de cómputo en laboratorio principal. Registro de número de serie y estado de cada equipo.",
        },
        {
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
      ],
    });
    await prisma.assignment.update({
      where: { id: assign1.id },
      data:  { accumulatedMinutes: 390 },
    });
  }

  if (count2 === 0) {
    await prisma.workSession.createMany({
      data: [
        {
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
        {
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
      ],
    });
    await prisma.assignment.update({
      where: { id: assign2.id },
      data:  { accumulatedMinutes: 210 },
    });
  }

  if (count3 === 0) {
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
  }

  if (count4 === 0) {
    await prisma.workSession.createMany({
      data: [
        {
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
        {
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
        {
          assignmentId: assign4.id,
          studentId:    alumno4.id,
          startTime:    new Date("2024-09-02T10:00:00.000-06:00"),
          endTime:      new Date("2024-09-02T12:00:00.000-06:00"),
          totalMinutes: 120,
          status:       Status.PENDIENTE,
          isManual:     false,
          description:  "Actualización de base de datos de contactos de alumnos. Verificación y corrección de información de expedientes.",
        },
      ],
    });
    await prisma.assignment.update({
      where: { id: assign4.id },
      data:  { accumulatedMinutes: 210 },
    });
  }

  if (count5 === 0) {
    await prisma.workSession.createMany({
      data: [
        {
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
        {
          assignmentId: assign5.id,
          studentId:    alumno5.id,
          startTime:    new Date("2024-08-26T14:00:00.000-06:00"),
          endTime:      new Date("2024-08-26T15:00:00.000-06:00"),
          totalMinutes: 60,
          status:       Status.CANCELADA,
          isManual:     false,
          description:  "Jornada cancelada por el alumno.",
        },
      ],
    });
    await prisma.assignment.update({
      where: { id: assign5.id },
      data:  { accumulatedMinutes: 60 },
    });
  }

  console.log("✅ Jornadas de ejemplo verificadas");
  console.log("");
  console.log("🎉 Seed completado exitosamente.");
  console.log("");
  console.log("Credenciales:");
  console.log("  Admin:    admin@anahuac.mx  / Admin123!");
  console.log("  Jefe 1:   jefe1@anahuac.mx  / Jefe123!");
  console.log("  Jefe 2:   jefe2@anahuac.mx  / Jefe123!");
  console.log("  Alumno 1: alumno1@anahuac.mx / Alumno123! (80%, ACADEMICA)");
  console.log("  Alumno 2: alumno2@anahuac.mx / Alumno123! (50%, EXCELENCIA)");
  console.log("  Alumno 3: alumno3@anahuac.mx / Alumno123! (30%, SEP)");
  console.log("  Alumno 4: alumno4@anahuac.mx / Alumno123! (100%, DEPORTIVA)");
  console.log("  Alumno 5: alumno5@anahuac.mx / Alumno123! (25%, CULTURAL)");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
