"server component";

import { Providers } from "@/providers/Provaiders";
import { Toaster } from "sonner";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
