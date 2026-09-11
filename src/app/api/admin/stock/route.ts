import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { checkAndNotifyStock } from "@/lib/notifications";

const stockAdjustSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  adjustment: z.number(), // positive = add, negative = subtract
  reason: z.string().min(1, "Motivo é obrigatório"),
});

// PUT /api/admin/stock — ajuste manual de estoque
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = stockAdjustSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { productId, variantId, adjustment, reason } = parsed.data;

    if (variantId) {
      // Adjust variant stock
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true, name: true },
      });

      if (!variant) {
        return NextResponse.json({ error: "Variação não encontrada" }, { status: 404 });
      }

      const newStock = variant.stock + adjustment;
      if (newStock < 0) {
        return NextResponse.json(
          { error: `Estoque não pode ficar negativo. Atual: ${variant.stock}` },
          { status: 400 }
        );
      }

      await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      });

      // Get product info for notification
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true, stockUnit: true, lowStockThreshold: true },
      });

      if (product) {
        checkAndNotifyStock(
          `${product.name} (${variant.name})`,
          newStock,
          product.stockUnit,
          product.lowStockThreshold
        );
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id!,
          action: "STOCK_ADJUST",
          entityType: "ProductVariant",
          entityId: variantId,
          details: {
            productId,
            adjustment,
            reason,
            previousStock: variant.stock,
            newStock,
          },
        },
      });

      return NextResponse.json({
        ok: true,
        previousStock: variant.stock,
        newStock,
        variantName: variant.name,
      });
    } else {
      // Adjust product-level stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, name: true, stockUnit: true, lowStockThreshold: true },
      });

      if (!product) {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
      }

      const newStock = Math.round((product.stock + adjustment) * 1000) / 1000;
      if (newStock < 0) {
        return NextResponse.json(
          { error: `Estoque não pode ficar negativo. Atual: ${product.stock}` },
          { status: 400 }
        );
      }

      await prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      checkAndNotifyStock(
        product.name,
        newStock,
        product.stockUnit,
        product.lowStockThreshold
      );

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id!,
          action: "STOCK_ADJUST",
          entityType: "Product",
          entityId: productId,
          details: {
            adjustment,
            reason,
            previousStock: product.stock,
            newStock,
          },
        },
      });

      return NextResponse.json({
        ok: true,
        previousStock: product.stock,
        newStock,
        productName: product.name,
      });
    }
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json({ error: "Erro interno ao ajustar estoque" }, { status: 500 });
  }
}
