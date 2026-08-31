import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/favorites — list user's favorites
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          compareAtPrice: true,
          isActive: true,
          images: {
            select: { url: true, altText: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
          variants: {
            select: { stock: true },
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = favorites.map((fav) => ({
    id: fav.id,
    productId: fav.productId,
    createdAt: fav.createdAt.toISOString(),
    product: {
      ...fav.product,
      basePrice: fav.product.basePrice.toString(),
      compareAtPrice: fav.product.compareAtPrice?.toString() || null,
      totalStock: fav.product.variants.reduce((sum, v) => sum + v.stock, 0),
      imageUrl: fav.product.images[0]?.url || null,
    },
  }));

  return NextResponse.json(serialized);
}

// POST /api/favorites — toggle favorite
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "productId é obrigatório" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          productId,
        },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Favorite error:", error);
    return NextResponse.json(
      { error: "Erro ao processar favorito" },
      { status: 500 }
    );
  }
}
