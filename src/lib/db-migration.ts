import { prisma } from "@/lib/prisma";

export async function ensureDatabaseColumns() {
  const statements = [
    `DO $$ BEGIN
      CREATE TYPE "OrderSource" AS ENUM ('WEBSITE', 'WHATSAPP', 'IN_PERSON');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,
    `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source" "OrderSource" NOT NULL DEFAULT 'WEBSITE';`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sells_by_unit" BOOLEAN NOT NULL DEFAULT true;`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "unit_weight_grams" DOUBLE PRECISION;`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "price_per_kg" DECIMAL(10, 2);`,
    `ALTER TABLE "products" ALTER COLUMN "stock" TYPE DOUBLE PRECISION USING "stock"::DOUBLE PRECISION;`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn("Migration statement warning:", err);
    }
  }
}
