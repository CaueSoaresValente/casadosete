import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Shield,
  CreditCard,
  Truck,
} from "lucide-react";

const footerLinks = {
  institucional: [
    { name: "Sobre nós", href: "/sobre" },
    { name: "Política de Privacidade", href: "/politica-privacidade" },
    { name: "Termos de Uso", href: "/termos-de-uso" },
    { name: "Trocas e Devoluções", href: "/trocas-devolucoes" },
  ],
  ajuda: [
    { name: "Como comprar", href: "/como-comprar" },
    { name: "Formas de pagamento", href: "/formas-pagamento" },
    { name: "Prazos de entrega", href: "/prazos-entrega" },
    { name: "Acompanhar pedido", href: "/conta/pedidos" },
  ],
  categorias: [
    { name: "Velas", href: "/categorias/velas" },
    { name: "Imagens", href: "/categorias/imagens" },
    { name: "Roupas", href: "/categorias/roupas" },
    { name: "Guias & Colares", href: "/categorias/guias-colares" },
    { name: "Incensos", href: "/categorias/incensos" },
    { name: "Ervas & Banhos", href: "/categorias/ervas-banhos" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-night-900 text-cream-200">
      {/* Trust bar */}
      <div className="border-b border-night-700">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-night-800">
              <Shield className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cream-100">
                Compra segura
              </p>
              <p className="text-xs text-night-300">
                Seus dados protegidos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-night-800">
              <CreditCard className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cream-100">
                PIX, cartão e boleto
              </p>
              <p className="text-xs text-night-300">
                Até 12x sem juros
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-night-800">
              <Truck className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cream-100">
                Entrega para todo o Brasil
              </p>
              <p className="text-xs text-night-300">
                Frete grátis acima de R$ 299
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/assets/logosete.png"
                alt="Casa do 7 Logo"
                className="h-12 w-auto object-contain"
              />
              <div className="flex flex-col">
                <h3
                  className="text-xl font-bold leading-tight"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--color-gold-400)",
                  }}
                >
                  Casa do 7
                </h3>
                <span className="text-[0.6rem] tracking-[0.15em] uppercase text-night-400">
                  Artigos Religiosos
                </span>
              </div>
            </div>
            <p className="text-sm text-night-300 mb-4 leading-relaxed">
              Artigos religiosos de Umbanda com respeito, qualidade e tradição.
              Entrega para todo o Brasil.
            </p>
            <div className="space-y-2">
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-night-300 hover:text-gold-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>(11) 99999-9999</span>
              </a>
              <a
                href="mailto:casadosete77@gmail.com"
                className="flex items-center gap-2 text-sm text-night-300 hover:text-gold-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>casadosete77@gmail.com</span>
              </a>
              <div className="flex items-start gap-2 text-sm text-night-300">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>São Paulo — SP</span>
              </div>
            </div>
          </div>

          {/* Institucional */}
          <div>
            <h4 className="text-sm font-semibold text-cream-100 uppercase tracking-wider mb-4">
              Institucional
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.institucional.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-night-300 hover:text-gold-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ajuda */}
          <div>
            <h4 className="text-sm font-semibold text-cream-100 uppercase tracking-wider mb-4">
              Ajuda
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.ajuda.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-night-300 hover:text-gold-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categorias */}
          <div>
            <h4 className="text-sm font-semibold text-cream-100 uppercase tracking-wider mb-4">
              Categorias
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.categorias.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-night-300 hover:text-gold-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-night-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-night-400">
            © {new Date().getFullYear()} Casa do 7 — Todos os direitos
            reservados. CNPJ: XX.XXX.XXX/0001-XX
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/politica-privacidade"
              className="text-xs text-night-400 hover:text-gold-400 transition-colors"
            >
              Privacidade
            </Link>
            <span className="text-night-600">|</span>
            <Link
              href="/termos-de-uso"
              className="text-xs text-night-400 hover:text-gold-400 transition-colors"
            >
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
