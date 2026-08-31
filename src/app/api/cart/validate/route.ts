import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const validateSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().nullable(),
      quantity: z.number().int().positive(),
    })
  ),
});

// POST /api/cart/validate — validates cart items against current DB state
// Returns which items are still valid, which changed, and which should be removed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { items } = parsed.data;
    const results = [];
    const warnings: string[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          isActive: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { url: true },
          },
        },
      });

      // Product doesn't exist anymore
      if (!product) {
        warnings.push(`Um produto do seu carrinho não existe mais e foi removido.`);
        results.push({
          productId: item.productId,
          variantId: item.variantId,
          status: "REMOVED" as const,
          reason: "Produto não existe mais",
        });
        continue;
      }

      // Product was deactivated
      if (!product.isActive) {
        warnings.push(`"${product.name}" não está mais disponível e foi removido.`);
        results.push({
          productId: item.productId,
          variantId: item.variantId,
          status: "REMOVED" as const,
          reason: `"${product.name}" foi desativado`,
        });
        continue;
      }

      let currentPrice = parseFloat(product.basePrice.toString());
      let currentStock = Infinity; // No variant = unlimited stock
      let variantName: string | null = null;

      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { id: true, name: true, price: true, stock: true, isActive: true },
        });

        if (!variant || !variant.isActive) {
          warnings.push(`A variação selecionada de "${product.name}" não está mais disponível.`);
          results.push({
            productId: item.productId,
            variantId: item.variantId,
            status: "REMOVED" as const,
            reason: "Variação não disponível",
          });
          continue;
        }

        if (variant.price) currentPrice = parseFloat(variant.price.toString());
        currentStock = variant.stock;
        variantName = variant.name;
      }

      // Check stock
      if (currentStock === 0) {
        warnings.push(`"${product.name}"${variantName ? ` (${variantName})` : ""} está esgotado.`);
        results.push({
          productId: item.productId,
          variantId: item.variantId,
          status: "REMOVED" as const,
          reason: "Produto esgotado",
        });
        continue;
      }

      // Quantity exceeds stock
      const adjustedQty = Math.min(item.quantity, currentStock);
      const quantityChanged = adjustedQty !== item.quantity;

      if (quantityChanged) {
        warnings.push(
          `Quantidade de "${product.name}"${variantName ? ` (${variantName})` : ""} ajustada para ${adjustedQty} (estoque disponível).`
        );
      }

      results.push({
        productId: item.productId,
        variantId: item.variantId,
        status: quantityChanged ? ("UPDATED" as const) : ("OK" as const),
        name: product.name,
        variantName,
        slug: product.slug,
        price: currentPrice,
        quantity: adjustedQty,
        stock: currentStock === Infinity ? 999 : currentStock,
        imageUrl: product.images[0]?.url || null,
      });
    }

    return NextResponse.json({
      items: results,
      warnings,
      hasChanges: results.some((r) => r.status !== "OK"),
    });
  } catch (error) {
    console.error("Cart validate error:", error);
    return NextResponse.json(
      { error: "Erro ao validar carrinho" },
      { status: 500 }
    );
  }
}
