import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CategoryProducts from "./CategoryProducts";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    select: { name: true, description: true },
  });

  if (!category) return {};

  return {
    title: category.name,
    description: category.description || `${category.name} — artigos religiosos de Umbanda na Casa do 7`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      },
      parent: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!category) notFound();

  return (
    <CategoryProducts
      category={{
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        children: category.children,
        parent: category.parent,
      }}
    />
  );
}
