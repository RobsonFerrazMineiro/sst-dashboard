"use client";

import { FileText, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "asos" | "treinamentos";

type TabNavigationProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
};

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  const tabs = [
    { value: "asos" as const, label: "ASOs", icon: FileText },
    {
      value: "treinamentos" as const,
      label: "Treinamentos",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="inline-flex">
      <div
        role="tablist"
        aria-label="Navegação entre painéis do dashboard"
        className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`dashboard-tab-${tab.value}`}
              aria-selected={isActive}
              aria-controls={`dashboard-panel-${tab.value}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon aria-hidden="true" className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
