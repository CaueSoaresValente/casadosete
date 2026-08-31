import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators/product";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/admin/products/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      categories: { include: { category: true } },
      variants: { orderBy: { name: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PUT /api/admin/products/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check slug uniqueness (exclude current)
    const existing = await prisma.product.findFirst({
      where: { slug: data.slug, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    const product = await prisma.$transaction(async (tx) => {
      // Update product
      const p = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          shortDescription: data.shortDescription,
          basePrice: new Prisma.Decimal(data.basePrice),
          compareAtPrice: data.compareAtPrice ? new Prisma.Decimal(data.compareAtPrice) : null,
          costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : null,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          stock: data.stock ?? 0,
          stockUnit: data.stockUnit ?? "unit",
          lowStockThreshold: data.lowStockThreshold ?? 2,
          orixa: data.orixa,
          entidade: data.entidade,
          finalidade: data.finalidade,
        },
      });

      // Re-link categories
      await tx.productCategory.deleteMany({ where: { productId: id } });
      if (data.categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({
            productId: id,
            categoryId,
          })),
        });
      }

      // Re-create variants (delete old, create new)
      await tx.productVariant.deleteMany({ where: { productId: id } });
      if (data.variants && data.variants.length > 0) {
        await tx.productVariant.createMany({
          data: data.variants.map((v) => ({
            productId: id,
            sku: v.sku,
            name: v.name,
            attributes: v.attributes,
            price: v.price ? new Prisma.Decimal(v.price) : null,
            stock: v.stock,
            weight: v.weight ? new Prisma.Decimal(v.weight) : null,
            isActive: v.isActive,
          })),
        });
      }

      // Re-create images
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((img) => ({
            productId: id,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })),
        });
      }

      return p;
    });

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        categories: { include: { category: true } },
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(fullProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Check if this product has been ordered
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      // Product has order history — deactivate instead of deleting
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        ok: true,
        deactivated: true,
        message: `Produto desativado pois possui ${orderItemCount} pedido(s) vinculado(s). O histórico de pedidos foi preservado.`,
      });
    }

    // No order history — safe to fully delete
    // Clean up cart items first (no cascade on variant FK)
    await prisma.cartItem.deleteMany({ where: { productId: id } });

    // Delete the product (cascades to images, variants, categories, favorites, stockAlerts)
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Erro ao excluir produto. Verifique se não há dependências." }, { status: 500 });
  }
}

