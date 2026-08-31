import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalOrders,
    monthOrders,
    lastMonthOrders,
    pendingOrders,
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalProducts,
    activeProducts,
    lowStockVariants,
    totalCustomers,
    monthCustomers,
    totalLeads,
    recentOrders,
  ] = await Promise.all([
    // Orders — only count confirmed / paid orders (not pending payment or cancelled)
    prisma.order.count({
      where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startOfMonth },
        status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] },
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] },
      },
    }),
    prisma.order.count({
      where: { status: "PENDING_PAYMENT" },
    }),

    // Revenue — only include paid / confirmed orders
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED", "REFUNDED"] } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startOfMonth },
        status: { notIn: ["PENDING_PAYMENT", "CANCELLED", "REFUNDED"] },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { notIn: ["PENDING_PAYMENT", "CANCELLED", "REFUNDED"] },
      },
    }),

    // Products
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.productVariant.count({
      where: { stock: { lte: 5 }, isActive: true },
    }),

    // Customers
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } },
    }),

    // Leads
    prisma.newsletterLead.count({ where: { isActive: true } }),

    // Recent orders — only show orders that have been paid/confirmed
    prisma.order.findMany({
      where: {
        status: { notIn: ["PENDING_PAYMENT"] },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenueNum = Number(totalRevenue._sum.total || 0);
  const monthRevenueNum = Number(monthRevenue._sum.total || 0);
  const lastMonthRevenueNum = Number(lastMonthRevenue._sum.total || 0);

  const revenueGrowth =
    lastMonthRevenueNum > 0
      ? ((monthRevenueNum - lastMonthRevenueNum) / lastMonthRevenueNum) * 100
      : 0;

  const ordersGrowth =
    lastMonthOrders > 0
      ? ((monthOrders - lastMonthOrders) / lastMonthOrders) * 100
      : 0;

  return NextResponse.json({
    orders: {
      total: totalOrders,
      thisMonth: monthOrders,
      pending: pendingOrders,
      growth: Math.round(ordersGrowth),
    },
    revenue: {
      total: totalRevenueNum,
      thisMonth: monthRevenueNum,
      growth: Math.round(revenueGrowth),
    },
    products: {
      total: totalProducts,
      active: activeProducts,
      lowStock: lowStockVariants,
    },
    customers: {
      total: totalCustomers,
      thisMonth: monthCustomers,
    },
    leads: totalLeads,
    recentOrders: recentOrders.map((o) => ({
      ...o,
      total: o.total.toString(),
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
