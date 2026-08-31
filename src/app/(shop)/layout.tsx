import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { CookieBanner } from "@/components/shop/CookieBanner";
import { MiniCart } from "@/components/shop/MiniCart";
import { CartProvider } from "@/contexts/CartContext";
import { FloatingWhatsAppButton } from "@/components/shop/FloatingWhatsAppButton";

export default function ShopLayout({children,}: { children: React.ReactNode;}) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
        <MiniCart />
        <FloatingWhatsAppButton />
      </div>
    </CartProvider>
  );
}
