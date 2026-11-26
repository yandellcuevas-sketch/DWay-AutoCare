import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const montserrat = localFont({
  src: [
    { path: "./fonts/montserrat-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/montserrat-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/montserrat-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/montserrat-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/montserrat-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DWay AutoCare | Mantenimiento Automotriz en Taller y a Domicilio",
  description:
    "Tú eliges dónde, nosotros cuidamos tu vehículo. Servicio de mantenimiento preventivo en taller técnico y unidad móvil a domicilio en República Dominicana.",
  icons: {
    icon: [
      { url: "/icons/icon.png", type: "image/png", sizes: "256x256" },
      { url: "/icons/favicon-64.png", type: "image/png", sizes: "64x64" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body className="bg-[#FAFAFA] text-[#1E2127] antialiased">
        <a
          href="#main-content"
          className="visually-hidden fixed left-4 top-4 z-[100] rounded-lg bg-[#1E2127] px-4 py-2 text-sm font-semibold text-white"
        >
          Saltar al contenido principal
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
