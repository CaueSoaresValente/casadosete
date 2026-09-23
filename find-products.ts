import { prisma } from "./src/lib/prisma";

async function main() {
  const auditLogs = await prisma.auditLog.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: {
      action: true,
      entity: true,
      entityId: true,
      details: true,
      createdAt: true,
    },
  });
  console.log("RECENT_AUDIT_LOGS:", JSON.stringify(auditLogs, null, 2));

  const allOrderItems = await prisma.orderItem.findMany({
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          total: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
  console.log("ALL_ORDER_ITEMS:", JSON.stringify(allOrderItems, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
