"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function TreinamentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Treinamentos</h1>
        <p className="text-muted-foreground">
          Gerenciar Treinamentos Obrigatórios
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Treinamentos</h2>
              <p className="text-sm text-muted-foreground">
                Funcionalidade em desenvolvimento. Acesse através do Perfil do
                Colaborador.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Os Treinamentos são visualizados e gerenciados através da página
              de Perfil do Colaborador. Navegue até Colaboradores e selecione um
              colaborador para gerenciar seus treinamentos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
