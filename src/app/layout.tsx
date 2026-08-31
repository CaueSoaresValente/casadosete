import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/common/ToastProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Casa do 7 | Artigos Religiosos de Umbanda",
    template: "%s | Casa do 7",
  },
  description:
    "Loja online de artigos religiosos de Umbanda. Velas, imagens, roupas, guias, incensos e muito mais. Entrega para todo o Brasil.",
  keywords: [
    "umbanda",
    "artigos religiosos",
    "velas",
    "imagens",
    "orixás",
    "entidades",
    "guias",
    "roupas de umbanda",
    "incensos",
    "defumadores",
  ],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/assets/logosete.png",
    shortcut: "/assets/logosete.png",
    apple: "/assets/logosete.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
