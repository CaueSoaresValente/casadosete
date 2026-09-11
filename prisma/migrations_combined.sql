-- ==============================================================================
-- CASA DO SETE — SCRIPT SQL UNIFICADO DE MIGRAÇÃO
--
-- Este script reúne todas as alterações pendentes no banco PostgreSQL:
-- 1. Origens de pedidos (OrderSource: WEBSITE, WHATSAPP, IN_PERSON)
-- 2. Suporte a gestão de estoque em quilo (kg) com decimais
-- 3. Preço por kg e anotações de peso/venda unitária
--
-- Idempotente: pode ser executado mais de uma vez com segurança.
-- ==============================================================================

-- 1. Criação do enum OrderSource (caso ainda não exista)
DO $$ BEGIN
  CREATE TYPE "OrderSource" AS ENUM ('WEBSITE', 'WHATSAPP', 'IN_PERSON');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Adição da coluna 'source' na tabela orders
ALTER TABLE "orders" 
  ADD COLUMN IF NOT EXISTS "source" "OrderSource" NOT NULL DEFAULT 'WEBSITE';

-- 3. Adição dos novos campos de gestão de estoque e peso na tabela products
ALTER TABLE "products" 
  ADD COLUMN IF NOT EXISTS "sells_by_unit" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "products" 
  ADD COLUMN IF NOT EXISTS "unit_weight_grams" DOUBLE PRECISION;

ALTER TABLE "products" 
  ADD COLUMN IF NOT EXISTS "price_per_kg" DECIMAL(10, 2);

-- 4. Alteração do tipo da coluna 'stock' para DOUBLE PRECISION (permite decimais como 2.5 kg)
ALTER TABLE "products" 
  ALTER COLUMN "stock" TYPE DOUBLE PRECISION USING "stock"::DOUBLE PRECISION;

-- Verificação das alterações aplicadas
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name IN ('stock', 'sells_by_unit', 'unit_weight_grams', 'price_per_kg');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'source';
