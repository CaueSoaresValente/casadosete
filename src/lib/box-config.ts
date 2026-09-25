import { prisma } from "@/lib/prisma";

export async function getBoxConfig() {
  return prisma.boxConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      minItems: null,
      basePrice: 0,
      packagingFee: 8.0,
    },
  });
}
