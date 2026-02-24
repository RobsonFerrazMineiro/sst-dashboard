"use client";

import { FileText, GraduationCap } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  return (
    <div className="inline-flex">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabKey)}>
        <TabsList className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <TabsTrigger
            value="asos"
            className={cn(
              "gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-slate-100",
              "data-[state=active]:text-slate-900 text-slate-600",
            )}
          >
            <FileText className="w-4 h-4" />
            ASOs
          </TabsTrigger>

          <TabsTrigger
            value="treinamentos"
            className={cn(
              "gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-slate-100",
              "data-[state=active]:text-slate-900 text-slate-600",
            )}
          >
            <GraduationCap className="w-4 h-4" />
            Treinamentos
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
