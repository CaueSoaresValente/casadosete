import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators/product";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/admin/products — lista com paginação e filtros
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId");
  const isActive = searchParams.get("isActive");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) {
    where.categories = { some: { categoryId } };
  }

  if (isActive !== null && isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        categories: { include: { category: { select: { id: true, name: true } } } },
        variants: { select: { id: true, stock: true, price: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/admin/products — cria novo produto
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

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

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const p = await tx.product.create({
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

      // Link categories
      if (data.categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({
            productId: p.id,
            categoryId,
          })),
        });
      }

      // Create variants
      if (data.variants && data.variants.length > 0) {
        await tx.productVariant.createMany({
          data: data.variants.map((v) => ({
            productId: p.id,
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

      // Create images
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((img) => ({
            productId: p.id,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })),
        });
      }

      return p;
    });

    // Fetch complete product
    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        categories: { include: { category: true } },
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(fullProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
