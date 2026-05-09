import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface AppLogoProps {
  /** Tamanho da variante: "sm" (páginas compactas) | "md" (login/cadastro) | "lg" */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: {
    icon: "h-6 w-6",
    wrap: "p-1.5",
    title: "text-base",
    subtitle: "text-xs",
  },
  md: {
    icon: "h-8 w-8",
    wrap: "p-2",
    title: "text-xl",
    subtitle: "text-sm",
  },
  lg: {
    icon: "h-10 w-10",
    wrap: "p-2.5",
    title: "text-2xl",
    subtitle: "text-sm",
  },
};

export function AppLogo({ size = "md", className }: AppLogoProps) {
  const s = sizeMap[size];

  return (
    <div
      className={cn("flex flex-col items-center gap-2 text-center", className)}
    >
      <div
        className={cn(
          "rounded-xl bg-linear-to-br from-teal-800 via-teal-300 to-lime-200 shadow-md shadow-emerald-200",
          s.wrap,
        )}
      >
        <ShieldCheck className={cn(s.icon, "text-white")} />
      </div>
      <div className="leading-tight">
        <p className={cn("font-bold text-slate-900", s.title)}>Gestão SST</p>
        <p className={cn("text-slate-500", s.subtitle)}>ASOs & Treinamentos</p>
      </div>
    </div>
  );
}
