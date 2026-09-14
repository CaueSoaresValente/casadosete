import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureDatabaseColumns } from "@/lib/db-migration";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    await ensureDatabaseColumns();
    return NextResponse.json({
      success: true,
      message: "Colunas do banco de dados (sells_by_unit, unit_weight_grams, price_per_kg, stock, source) atualizadas com sucesso!",
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao aplicar migrações" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
