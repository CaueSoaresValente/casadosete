"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  BarChart3,
  Tag,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { name: "Dashboard", href: "/gestao", icon: LayoutDashboard },
  { name: "Produtos", href: "/gestao/produtos", icon: Package },
  { name: "Categorias", href: "/gestao/categorias", icon: FolderTree },
  { name: "Pedidos", href: "/gestao/pedidos", icon: ShoppingCart },
  { name: "Clientes", href: "/gestao/clientes", icon: Users },
  { name: "Leads & Alertas", href: "/gestao/leads", icon: Mail },
  { name: "Cupons", href: "/gestao/cupons", icon: Tag },
  { name: "Métricas", href: "/gestao/metricas", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Don't show admin layout on login page
  if (pathname === "/gestao/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-night-50">
      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-night-900 text-cream-200">
        {/* Logo */}
        <div className="p-5 border-b border-night-700">
          <Link href="/gestao" className="flex items-center gap-2.5">
            <img
              src="/assets/logosete.png"
              alt="Casa do 7 Logo"
              className="h-9 w-auto object-contain"
            />
            <span
              className="text-xl font-bold"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-gold-400)",
              }}
            >
              Casa do 7
            </span>
            <span className="text-[0.6rem] bg-gold-600 text-white px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase">
              Admin
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/gestao" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gold-600/20 text-gold-400"
                    : "text-night-300 hover:bg-night-800 hover:text-cream-100"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.name}
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-night-700">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-night-400 hover:bg-night-800 hover:text-cream-100 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
            Voltar à loja
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-night-900 text-cream-200 transform transition-transform duration-200 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 flex items-center justify-between border-b border-night-700">
          <span
            className="text-xl font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-gold-400)",
            }}
          >
            Casa do 7
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-night-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-0.5">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/gestao" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gold-600/20 text-gold-400"
                    : "text-night-300 hover:bg-night-800 hover:text-cream-100"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-night-100 px-4 py-3 flex items-center justify-between lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-night-50"
          >
            <Menu className="w-5 h-5 text-night-600" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
