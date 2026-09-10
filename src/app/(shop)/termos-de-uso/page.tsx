import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de Uso da Casa do 7 — condições gerais para uso do site e realização de compras.",
};

export default function TermosDeUsoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1
        className="text-3xl font-bold text-night-900 mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Termos de Uso
      </h1>
      <p className="text-sm text-night-400 mb-8">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <div className="prose prose-sm max-w-none text-night-700 space-y-6">
        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            1. Aceitação dos termos
          </h2>
          <p>
            Ao acessar e utilizar o site da Casa do 7 (casado7.com.br), você
            declara que leu, entendeu e concorda com estes Termos de Uso. Se não
            concordar com algum ponto, solicitamos que não utilize o site.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            2. Produtos e preços
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Os preços exibidos no site são em Reais (R$) e podem ser alterados
              sem aviso prévio, exceto para pedidos já confirmados.
            </li>
            <li>
              As imagens dos produtos são ilustrativas. Podem haver variações de
              cor e acabamento em relação ao produto real, especialmente em
              artigos artesanais (imagens de gesso, peças de barro/palha).
            </li>
            <li>
              A disponibilidade de estoque é atualizada em tempo real, mas pode
              haver divergências pontuais. Nesse caso, entraremos em contato para
              oferecer alternativas ou reembolso.
            </li>
          </ul>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            3. Pagamento
          </h2>
          <p>
            Aceitamos pagamento via PIX, cartão de crédito (até 12x),
            cartão de débito e boleto bancário. O processamento de pagamentos é
            realizado pelo gateway Mercado Pago, que possui seus próprios termos
            de serviço e política de privacidade.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            4. Entrega
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Realizamos entregas para todo o Brasil via Correios e
              transportadoras.
            </li>
            <li>
              Os prazos de entrega são calculados a partir da confirmação do
              pagamento e variam conforme a região.
            </li>
            <li>
              Frete grátis para compras acima de R$ 299,00 (condições válidas
              para entregas nacionais via modalidade econômica).
            </li>
          </ul>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            5. Trocas e devoluções
          </h2>
          <p>
            Em conformidade com o Código de Defesa do Consumidor (Lei nº
            8.078/90):
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>Direito de arrependimento:</strong> você pode desistir da
              compra em até 7 dias corridos após o recebimento do produto, desde
              que esteja em sua embalagem original, sem uso.
            </li>
            <li>
              <strong>Produto com defeito:</strong> entre em contato em até 30
              dias para produtos não duráveis ou 90 dias para produtos duráveis.
            </li>
            <li>
              O frete de devolução por arrependimento é de responsabilidade do
              comprador. Em caso de defeito, o frete é por nossa conta.
            </li>
          </ul>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            6. Propriedade intelectual
          </h2>
          <p>
            Todo o conteúdo do site (textos, imagens, logotipo, design) é de
            propriedade da Casa do 7 e protegido pela legislação brasileira de
            direitos autorais. É proibida a reprodução sem autorização.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            7. Contato
          </h2>
          <p>Para dúvidas sobre estes termos:</p>
          <ul className="list-none space-y-1 mt-2">
            <li>
              E-mail:{" "}
              <a
                href="mailto:casadosete77@gmail.com"
                className="text-gold-600 hover:underline"
              >
                casadosete77@gmail.com
              </a>
            </li>
            <li>WhatsApp: (11) 97667-2291</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
