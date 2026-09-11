import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre nós",
  description:
    "Conheça a Casa do 7 — artigos religiosos de Umbanda com respeito, qualidade e tradição, entregando para todo o Brasil.",
};

export default function SobrePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1
        className="text-3xl font-bold text-night-900 mb-8"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Sobre nós
      </h1>

      <div className="prose prose-sm max-w-none text-night-700 space-y-6">
        <section>
          <p>
            A <strong>Casa do 7</strong> nasceu do respeito e da devoção às
            tradições de Umbanda. Somos uma loja especializada em artigos
            religiosos, criada para atender terreiros, casas de fé e praticantes
            de todo o Brasil com produtos de qualidade e procedência.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Nossa missão
          </h2>
          <p>
            Facilitar o acesso a velas, imagens, guias, incensos, ervas e
            demais artigos usados nos trabalhos e rituais, com entrega rápida e
            segura para qualquer lugar do país — sem abrir mão do cuidado e do
            respeito que cada peça merece.
          </p>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Nossos valores
          </h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Respeito às tradições e à fé de cada cliente.</li>
            <li>Qualidade e cuidado na seleção de cada produto.</li>
            <li>Atendimento próximo e humano, direto pelo WhatsApp.</li>
            <li>Entrega para todo o Brasil, com transparência nos prazos.</li>
          </ul>
        </section>

        <section>
          <h2
            className="text-xl font-semibold text-night-800 mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Fale conosco
          </h2>
          <p>
            Tem alguma dúvida ou precisa de ajuda para escolher um produto?
            Fale com a gente pelo WhatsApp{" "}
            
              href="https://wa.me/5511976672291"
              className="text-gold-600 hover:underline"
            >
              (11) 97667-2291
            </a>
            , pelo e-mail{" "}
            
              href="mailto:casadosete77@gmail.com"
              className="text-gold-600 hover:underline"
            >
              casadosete77@gmail.com
            </a>{" "}
            ou siga a gente no Instagram{" "}
            
              href="https://instagram.com/casa7.oficial_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-600 hover:underline"
            >
              @casa7.oficial_
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
