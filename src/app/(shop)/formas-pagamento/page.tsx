import Link from "next/link";
import { CreditCard, Phone, ArrowLeft } from "lucide-react";

export default function FormasPagamentoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/" className="inline-flex items-center text-sm text-night-500 hover:text-gold-600 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Voltar para a página inicial
      </Link>
      
      <h1 className="text-3xl font-bold text-night-900 mb-6" style={{ fontFamily: "var(--font-heading)" }}>
        Formas de Pagamento
      </h1>
      
      <div className="bg-white p-8 rounded-2xl border border-border-light shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gold-50 text-gold-600 rounded-full">
            <CreditCard className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-night-800">Como funciona o pagamento?</h2>
        </div>
        
        <div className="space-y-4 text-night-600 leading-relaxed">
          <p>
            Atualmente, todo o processo de pagamento e cálculo de frete é realizado de forma humanizada e direta através do nosso WhatsApp.
          </p>
          <p>
            O fluxo funciona da seguinte forma:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Você adiciona os produtos desejados ao carrinho e envia o pedido.</li>
            <li>Você será redirecionado para o nosso WhatsApp com a lista de itens.</li>
            <li>Nossa equipe confirmará a disponibilidade, calculará o frete para o seu CEP e apresentará as opções de pagamento.</li>
            <li>Você realiza o pagamento da forma combinada (PIX, transferência, etc).</li>
          </ol>
          <p className="mt-6 pt-6 border-t border-night-100 flex items-center gap-2">
            <Phone className="w-5 h-5 text-gold-500" /> 
            Em caso de dúvidas, sinta-se à vontade para nos contatar antes mesmo de fechar o pedido!
          </p>
        </div>
      </div>
    </div>
  );
}
