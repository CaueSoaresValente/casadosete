import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Inicializando BoxConfig padrão...");

  const config = await prisma.boxConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      minItems: null,
      basePrice: 0,
    },
  });

  console.log("BoxConfig padrão garantido:", config);
}

main()
  .catch((e) => {
    console.error("Erro ao inicializar BoxConfig:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
