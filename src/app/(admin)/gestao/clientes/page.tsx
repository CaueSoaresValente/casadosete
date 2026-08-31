"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  Calendar,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  favoriteCount: number;
  totalSpent: number;
};

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-night-900"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Clientes
          </h1>
          <p className="text-xs text-night-500 mt-1">
            Total de {total} clientes cadastrados
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-night-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-night-100 bg-night-50">
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Cliente
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Contato
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Pedidos
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Total Gasto
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Favoritos
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Data de Cadastro
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-night-400 text-sm">
                    Carregando...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-night-400 text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 text-night-200" />
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-night-50 hover:bg-night-50/50"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-night-800">
                        {c.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-night-600 block">{c.email || "—"}</span>
                      {c.phone && (
                        <span className="text-xs text-night-400 block">{c.phone}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        <ShoppingBag className="w-3 h-3" />
                        {c.orderCount} {c.orderCount === 1 ? "pedido" : "pedidos"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-night-900">
                      {formatPrice(c.totalSpent * 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-night-500">
                        <Heart className="w-3 h-3 text-ruby-500" />
                        {c.favoriteCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-night-500">
                      {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-night-100">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-night-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 text-night-500" />
            </button>
            <span className="text-sm text-night-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-night-100 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4 text-night-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
