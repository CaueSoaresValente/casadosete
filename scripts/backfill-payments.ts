/**
 * backfill-payments.ts
 *
 * Converte os valores legados de payment_status para os valores canônicos do novo sistema.
 * Mapeamento:
 *   CONFIRMED  → aprovado
 *   CANCELLED  → cancelado
 *   PENDING    → a_combinar
 *   pending    → a_combinar
 *
 * Por padrão roda em modo DRY-RUN (simulação, sem gravar).
 * Para gravar de verdade: npx.cmd tsx --env-file=.env scripts/backfill-payments.ts --apply
 *
 * Idempotente: só altera pedidos cujo payment_status seja um dos valores legados listados acima.
 * payment_method, payment_provider, payment_transaction_id, payment_paid_at e payment_amount
 * NÃO são tocados.
 */

import { prisma } from "../src/lib/prisma";

const LEGACY_MAP: Record<string, string> = {
  CONFIRMED: "aprovado",
  CANCELLED: "cancelado",
  PENDING: "a_combinar",
  pending: "a_combinar",
};

const isApply = process.argv.includes("--apply");

async function main() {
  console.log(`\n=== Backfill payment_status ===`);
  console.log(`Modo: ${isApply ? "⚠️  APPLY (vai gravar no banco)" : "🔍 DRY-RUN (simulação, sem gravar)"}\n`);

  // 1. Contar quantos seriam convertidos por valor legado
  for (const [legacy, canonical] of Object.entries(LEGACY_MAP)) {
    const count = await prisma.order.count({
      where: { paymentStatus: legacy },
    });
    console.log(`  "${legacy}" → "${canonical}": ${count} pedido(s)`);
  }

  if (!isApply) {
    console.log("\n⚡ Nenhuma alteração foi feita. Passe --apply para executar.");
    return;
  }

  // 2. Aplicar conversões
  console.log("\nAplicando conversões...");
  for (const [legacy, canonical] of Object.entries(LEGACY_MAP)) {
    const result = await prisma.order.updateMany({
      where: { paymentStatus: legacy },
      data: { paymentStatus: canonical },
    });
    console.log(`  "${legacy}" → "${canonical}": ${result.count} pedido(s) atualizados`);
  }

  console.log("\n✅ Backfill concluído.");
}

main().catch(console.error).finally(() => process.exit(0));
