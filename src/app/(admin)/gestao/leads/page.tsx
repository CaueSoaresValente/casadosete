"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Users,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Bell,
  Package,
} from "lucide-react";

type Lead = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  isActive: boolean;
  createdAt: string;
};

type StockAlertItem = {
  id: string;
  email: string | null;
  phone: string | null;
  productId: string;
  notified: boolean;
  createdAt: string;
  product: { name: string; slug: string };
};

export default function AdminLeadsPage() {
  const [activeTab, setActiveTab] = useState<"newsletter" | "stockAlerts">(
    "newsletter"
  );

  // Newsletter state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsTotal, setLeadsTotal] = useState(0);

  // Stock alerts state
  const [alerts, setAlerts] = useState<StockAlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams({
        page: leadsPage.toString(),
        limit: "20",
      });
      if (leadsSearch) params.set("search", leadsSearch);

      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setLeadsTotalPages(data.totalPages || 1);
      setLeadsTotal(data.total || 0);
    } catch {
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsPage, leadsSearch]);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch("/api/admin/stock-alerts");
      const data = await res.json();
      setAlerts(data || []);
    } catch {
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "newsletter") fetchLeads();
    else fetchAlerts();
  }, [activeTab, fetchLeads, fetchAlerts]);

  const exportLeads = () => {
    const csv = [
      "Contato,Nome,Data",
      ...leads.map(
        (l) =>
          `${l.phone || l.email || ""},${l.name || ""},${new Date(l.createdAt).toLocaleDateString("pt-BR")}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-newsletter-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1
        className="text-2xl font-bold text-night-900 mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Leads & Alertas
      </h1>

      {/* Explanation box */}
      <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-gold-800 mb-1">💡 O que são Leads?</h3>
        <p className="text-xs text-gold-700 leading-relaxed">
          <strong>Leads são contatos de pessoas interessadas</strong> na sua loja que deixaram o número de WhatsApp
          no formulário do rodapé do site (&quot;Fique por dentro das novidades&quot;).
          São potenciais clientes que ainda não fizeram uma compra, mas demonstraram interesse.
          Use esses contatos para enviar promoções, novidades e conteúdos pelo WhatsApp.
        </p>
        <p className="text-xs text-gold-700 leading-relaxed mt-1.5">
          <strong>Alertas de estoque</strong> são clientes que pediram para serem avisados quando um produto voltar ao estoque.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-night-100 rounded-lg p-1 inline-flex">
        <button
          onClick={() => setActiveTab("newsletter")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "newsletter"
              ? "bg-white text-night-800 shadow-sm"
              : "text-night-500 hover:text-night-700"
          }`}
        >
          <Mail className="w-4 h-4" />
          Newsletter ({leadsTotal})
        </button>
        <button
          onClick={() => setActiveTab("stockAlerts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "stockAlerts"
              ? "bg-white text-night-800 shadow-sm"
              : "text-night-500 hover:text-night-700"
          }`}
        >
          <Bell className="w-4 h-4" />
          Alertas de estoque
        </button>
      </div>

      {activeTab === "newsletter" && (
        <div>
          {/* Search + Export */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
              <input
                type="text"
                placeholder="Buscar por telefone ou e-mail..."
                value={leadsSearch}
                onChange={(e) => {
                  setLeadsSearch(e.target.value);
                  setLeadsPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
            <button
              onClick={exportLeads}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-night-200 text-sm font-medium text-night-600 hover:bg-night-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          {/* Leads table */}
          <div className="bg-white rounded-xl border border-night-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-night-100 bg-night-50">
                  <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                    Contato (WhatsApp / E-mail)
                  </th>
                  <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                    Nome
                  </th>
                  <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                    Data de cadastro
                  </th>
                  <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {leadsLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-night-400 text-sm">
                      Carregando...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-night-400 text-sm">
                      <Users className="w-8 h-8 mx-auto mb-2 text-night-200" />
                      Nenhum lead encontrado
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-night-50 hover:bg-night-50/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-night-800">
                        {lead.phone || lead.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-night-600">
                        {lead.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-night-500">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            lead.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-night-100 text-night-500"
                          }`}
                        >
                          {lead.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {leadsTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-night-100">
                <button
                  onClick={() => setLeadsPage(Math.max(1, leadsPage - 1))}
                  disabled={leadsPage === 1}
                  className="p-1.5 rounded hover:bg-night-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-night-600">
                  {leadsPage} / {leadsTotalPages}
                </span>
                <button
                  onClick={() =>
                    setLeadsPage(Math.min(leadsTotalPages, leadsPage + 1))
                  }
                  disabled={leadsPage === leadsTotalPages}
                  className="p-1.5 rounded hover:bg-night-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "stockAlerts" && (
        <div className="bg-white rounded-xl border border-night-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-night-100 bg-night-50">
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Produto
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Contato
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Data
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Notificado
                </th>
              </tr>
            </thead>
            <tbody>
              {alertsLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-night-400 text-sm">
                    Carregando...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-night-400 text-sm">
                    <Package className="w-8 h-8 mx-auto mb-2 text-night-200" />
                    Nenhum alerta de estoque
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-b border-night-50 hover:bg-night-50/50"
                  >
                    <td className="px-4 py-3 text-sm text-night-800">
                      {alert.product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-night-600">
                      {alert.email || alert.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-night-500">
                      {new Date(alert.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          alert.notified
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {alert.notified ? "Sim" : "Pendente"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
