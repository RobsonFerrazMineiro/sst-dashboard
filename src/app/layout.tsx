"server component";

import type { Metadata } from "next";
import { Providers } from "@/providers/Provaiders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão SST",
  description: "SaaS SST Lite para gestão de ASOs, treinamentos e conformidade.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
