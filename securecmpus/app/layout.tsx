import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "SecureCampus - Sistema Académico Seguro",
  description: "Plataforma institucional de gestión escolar con arquitectura defensiva.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-white min-h-screen flex flex-col antialiased">
        <Header rolActivo="ADMIN" nombreUsuario="Ricardo (Dev)" />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}