import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const [config, orixas, items, objectOptions, imageOptions] = await Promise.all([
    prisma.boxConfig.findUnique({ where: { id: "default" } }),
    prisma.orixa.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, colorHex: true },
    }),
    prisma.boxItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        maxQuantity: true,
      },
    }),
    prisma.boxObjectOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, price: true },
    }),
    prisma.boxImageOption
      .findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, price: true, imageUrl: true },
      })
      .catch((err) => {
        console.warn("Could not query box_image_options (table may not exist yet):", err);
        return [];
      }),
  ]);

  return NextResponse.json({
    config: config
      ? {
          minItems: config.minItems,
          basePrice: config.basePrice.toString(),
          boxImageUrl: config.boxImageUrl,
        }
      : null,
    orixas,
    items: items.map((i) => ({
      ...i,
      price: i.price.toString(),
    })),
    objectOptions: objectOptions.map((o) => ({
      ...o,
      price: o.price.toString(),
    })),
    imageOptions: imageOptions.map((o) => ({
      ...o,
      price: o.price.toString(),
    })),
  });
}
