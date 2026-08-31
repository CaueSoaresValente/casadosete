import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/catalog/products — listagem pública com filtros e paginação
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(40, Math.max(1, parseInt(searchParams.get("limit") || "12")));
  const search = searchParams.get("search") || "";
  const categorySlug = searchParams.get("category");
  const orixa = searchParams.get("orixa");
  const entidade = searchParams.get("entidade");
  const finalidade = searchParams.get("finalidade");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const featured = searchParams.get("featured");

  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { orixa: { contains: search, mode: "insensitive" } },
      { entidade: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categorySlug) {
    // Find category and all its children
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: { children: { select: { id: true } } },
    });

    if (category) {
      const categoryIds = [category.id, ...category.children.map((c) => c.id)];
      where.categories = { some: { categoryId: { in: categoryIds } } };
    }
  }

  if (orixa) where.orixa = { contains: orixa, mode: "insensitive" };
  if (entidade) where.entidade = { contains: entidade, mode: "insensitive" };
  if (finalidade) where.finalidade = { contains: finalidade, mode: "insensitive" };
  if (featured === "true") where.isFeatured = true;

  if (minPrice || maxPrice) {
    where.basePrice = {};
    if (minPrice) where.basePrice.gte = new Prisma.Decimal(parseFloat(minPrice));
    if (maxPrice) where.basePrice.lte = new Prisma.Decimal(parseFloat(maxPrice));
  }

  // Map sortBy to valid Prisma field
  const orderByMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
    createdAt: { createdAt: sortOrder },
    price: { basePrice: sortOrder },
    name: { name: sortOrder },
    popular: { viewCount: "desc" },
  };

  const orderBy = orderByMap[sortBy] || { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        basePrice: true,
        compareAtPrice: true,
        orixa: true,
        entidade: true,
        isFeatured: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true, altText: true },
        },
        categories: {
          include: { category: { select: { name: true, slug: true } } },
        },
        variants: {
          where: { isActive: true },
          select: { id: true, stock: true, price: true },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Compute stock status for each product
  const productsWithStock = products.map((p) => {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
    const hasVariants = p.variants.length > 0;
    return {
      ...p,
      inStock: hasVariants ? totalStock > 0 : true,
      totalStock: hasVariants ? totalStock : null,
    };
  });

  return NextResponse.json({
    products: productsWithStock,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
