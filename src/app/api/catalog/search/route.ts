import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/catalog/search?q=term — busca rápida para preview
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { shortDescription: { contains: query, mode: "insensitive" } },
          { orixa: { contains: query, mode: "insensitive" } },
          { entidade: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true, altText: true },
        },
      },
      take: 5,
      orderBy: { viewCount: "desc" },
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 3,
    }),
  ]);

  return NextResponse.json({ products, categories });
}
