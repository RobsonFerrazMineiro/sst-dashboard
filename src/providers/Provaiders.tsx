"use client";

import { makeQueryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
