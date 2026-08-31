import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetail from "./ProductDetail";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: { name: true, metaTitle: true, metaDescription: true, shortDescription: true },
  });

  if (!product) return {};

  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.shortDescription || `${product.name} — Casa do 7`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { name: "asc" } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  if (!product) notFound();

  // Increment view count
  prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // Serialize Decimal fields
  const serializedProduct = {
    ...product,
    basePrice: product.basePrice.toString(),
    compareAtPrice: product.compareAtPrice?.toString() || null,
    costPrice: product.costPrice?.toString() || null,
    variants: product.variants.map((v) => ({
      ...v,
      price: v.price?.toString() || null,
      weight: v.weight?.toString() || null,
      attributes: (v.attributes as Record<string, string>) || {},
    })),
  };

  return <ProductDetail product={serializedProduct} />;
}
