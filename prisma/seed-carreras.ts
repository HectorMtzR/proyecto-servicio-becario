import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CARRERAS: { name: string; faculty: string }[] = [
  { name: "Comunicación",                                                    faculty: "Escuela de Comunicación" },

  { name: "Diseño Multimedia",                                               faculty: "Escuela de Diseño" },
  { name: "Diseño Industrial",                                               faculty: "Escuela de Diseño" },
  { name: "Diseño de Moda e Innovación",                                     faculty: "Escuela de Diseño" },
  { name: "Diseño Gráfico",                                                  faculty: "Escuela de Diseño" },

  { name: "Derecho",                                                         faculty: "Escuela de Derecho" },

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

async function main() {
  console.log(`🌱 Insertando/actualizando ${CARRERAS.length} carreras...`);

  let creadas      = 0;
  let actualizadas = 0;

  for (const c of CARRERAS) {
    const existing = await prisma.career.findUnique({ where: { name: c.name } });
    await prisma.career.upsert({
      where:  { name: c.name },
      update: { faculty: c.faculty },
      create: { name: c.name, faculty: c.faculty },
    });
    if (existing) actualizadas += 1;
    else creadas += 1;
  }

  console.log(`✅ Listo — ${creadas} creada(s), ${actualizadas} actualizada(s)`);
}

main()
  .catch((e) => {
    console.error("❌ Error al sembrar carreras:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
