import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators/category";
import { auth } from "@/lib/auth";

// GET /api/admin/categories/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: true,
      children: { orderBy: { sortOrder: "asc" } },
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  return NextResponse.json(category);
}

// PUT /api/admin/categories/[id]
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
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, slug, description, imageUrl, parentId, sortOrder, isActive } = parsed.data;

    // Check slug uniqueness (exclude current)
    const existing = await prisma.category.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    // Prevent self-parenting
    if (parentId === id) {
      return NextResponse.json({ error: "Categoria não pode ser pai de si mesma" }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
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

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id]
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
    // Check for child categories
    const children = await prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      return NextResponse.json(
        { error: "Remova ou mova as subcategorias antes de excluir" },
        { status: 400 }
      );
    }

    // Check for linked products
    const products = await prisma.productCategory.count({ where: { categoryId: id } });
    if (products > 0) {
      return NextResponse.json(
        { error: `Esta categoria possui ${products} produto(s) vinculado(s). Desvincule-os antes de excluir.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
