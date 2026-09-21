-- backfill.sql
-- Converte valores legados de payment_status para os canônicos do novo sistema.
-- Mapeamento:
--   CONFIRMED → aprovado
--   CANCELLED → cancelado
--   PENDING   → a_combinar
--   pending   → a_combinar
--
-- Idempotente: WHERE garante que só atualiza linhas com os valores legados.
-- Não altera: payment_method, payment_provider, payment_transaction_id,
--             payment_paid_at, payment_amount nem nenhum outro campo.
--
-- Para simular (ver quantas linhas seriam afetadas), rode antes:
--   SELECT payment_status, COUNT(*) FROM orders
--   WHERE payment_status IN ('CONFIRMED','CANCELLED','PENDING','pending')
--   GROUP BY payment_status;
--
-- Para aplicar:
--   npx prisma db execute --file=scripts/backfill.sql --schema=prisma/schema.prisma

UPDATE "orders"
SET "payment_status" = 'aprovado'
WHERE "payment_status" = 'CONFIRMED';

UPDATE "orders"
SET "payment_status" = 'cancelado'
WHERE "payment_status" = 'CANCELLED';

UPDATE "orders"
SET "payment_status" = 'a_combinar'
WHERE "payment_status" IN ('PENDING', 'pending');
