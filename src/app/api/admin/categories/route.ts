import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators/category";
import { auth } from "@/lib/auth";

// GET /api/admin/categories — lista todas as categorias (hierárquica)
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    include: {
      children: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { products: true },
      },
    },
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(categories);
}

// POST /api/admin/categories — cria nova categoria
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, slug, description, imageUrl, parentId, sortOrder, isActive } = parsed.data;

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl: imageUrl || null,
        parentId: parentId || null,
        sortOrder,
        isActive,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
