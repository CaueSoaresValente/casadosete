import { z } from "zod";

export const productVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU é obrigatório"),
  name: z.string().min(1, "Nome da variação é obrigatório"),
  attributes: z.record(z.string(), z.string()).default({}),
  price: z.number().positive().optional().nullable(),
  stock: z.number().int().nonnegative().default(0),
  weight: z.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1, "Caminho da imagem é obrigatório"),
  altText: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

export const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  slug: z.string().min(2, "Slug inválido"),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  basePrice: z.number().positive("Preço base deve ser maior que 0"),
  compareAtPrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  stock: z.number().nonnegative("Estoque não pode ser negativo").default(0),
  stockUnit: z.enum(["unit", "kg"]).default("unit"),
  lowStockThreshold: z.number().nonnegative().default(2),
  orixa: z.string().optional().nullable(),
  entidade: z.string().optional().nullable(),
  finalidade: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).min(1, "Selecione ao menos uma categoria"),
  variants: z.array(productVariantSchema).optional().default([]),
  images: z.array(productImageSchema).optional().default([]),
});

export type ProductInput = z.infer<typeof productSchema>;
