import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade da Casa do 7 — saiba como coletamos, usamos e protegemos seus dados pessoais, em conformidade com a LGPD.",
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1
        className="text-3xl font-bold text-night-900 mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Política de Privacidade
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
            1. Quem somos
          </h2>
          <p>
            A <strong>Casa do 7</strong> é uma loja virtual de artigos religiosos
            de Umbanda, operada por [Razão Social], inscrita no CNPJ sob o nº
            [XX.XXX.XXX/0001-XX], com sede em São Paulo — SP. Para fins da Lei
            Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), somos a
            controladora dos seus dados pessoais.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            2. Dados que coletamos
          </h2>
          <p>Coletamos os seguintes dados pessoais:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>Dados de identificação:</strong> nome, e-mail, telefone/WhatsApp, CPF (para emissão de nota fiscal).
            </li>
            <li>
              <strong>Dados de entrega:</strong> endereço completo (CEP, logradouro, número, complemento, bairro, cidade, estado).
            </li>
            <li>
              <strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas, cookies (conforme sua preferência).
            </li>
            <li>
              <strong>Dados de pagamento:</strong> processados diretamente pelo gateway de pagamento (Mercado Pago). Não armazenamos dados de cartão de crédito.
            </li>
          </ul>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            3. Base legal e finalidade
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold">Dado</th>
                  <th className="text-left py-2 pr-4 font-semibold">Base legal</th>
                  <th className="text-left py-2 font-semibold">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                <tr>
                  <td className="py-2 pr-4">Nome, e-mail, telefone, endereço</td>
                  <td className="py-2 pr-4">Execução do contrato</td>
                  <td className="py-2">Processar e entregar seu pedido</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">CPF</td>
                  <td className="py-2 pr-4">Obrigação legal</td>
                  <td className="py-2">Emissão de nota fiscal</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">E-mail/WhatsApp (marketing)</td>
                  <td className="py-2 pr-4">Consentimento</td>
                  <td className="py-2">Envio de promoções e ofertas</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Cookies de analytics</td>
                  <td className="py-2 pr-4">Consentimento</td>
                  <td className="py-2">Análise de uso do site</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            4. Seus direitos (LGPD)
          </h2>
          <p>Você tem o direito de:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Acessar seus dados pessoais a qualquer momento pela área "Meus Dados".</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>Solicitar a exportação dos seus dados em formato legível.</li>
            <li>Solicitar a exclusão dos seus dados pessoais.</li>
            <li>Revogar consentimentos concedidos anteriormente.</li>
            <li>Solicitar informações sobre compartilhamento de dados com terceiros.</li>
          </ul>
          <p className="mt-2">
            Para exercer qualquer destes direitos, entre em contato pelo e-mail{" "}
            <a
              href="mailto:casadosete77@gmail.com"
              className="text-gold-600 hover:underline"
            >
              casadosete77@gmail.com
            </a>{" "}
            ou pela área "Meus Dados" no site.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            5. Cookies
          </h2>
          <p>
            Utilizamos cookies essenciais para o funcionamento do site. Cookies de
            analytics e marketing são opcionais e só são ativados mediante seu
            consentimento explícito, dado através do banner de cookies exibido em
            sua primeira visita. Você pode alterar suas preferências a qualquer
            momento.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            6. Segurança
          </h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados:
            criptografia em trânsito (HTTPS/TLS), criptografia de dados sensíveis
            em repouso (AES-256), controle de acesso por papel (RBAC) na área
            administrativa, e trilha de auditoria para acessos a dados de
            clientes.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            7. Compartilhamento de dados
          </h2>
          <p>Seus dados podem ser compartilhados com:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>Gateway de pagamento</strong> (Mercado Pago) — para
              processar transações financeiras.
            </li>
            <li>
              <strong>Transportadoras</strong> — para entrega dos pedidos.
            </li>
            <li>
              <strong>Contabilidade</strong> — para cumprimento de obrigações
              fiscais.
            </li>
          </ul>
          <p className="mt-2">
            Não vendemos, alugamos ou compartilhamos seus dados com terceiros para
            fins de marketing sem seu consentimento.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            8. Contato
          </h2>
          <p>
            Para dúvidas sobre esta política ou sobre o tratamento de seus dados:
          </p>
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
            <li>WhatsApp: (11) 99999-9999</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
