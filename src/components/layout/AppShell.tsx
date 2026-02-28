"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      {/* Desktop layout */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar className="sticky top-0 h-screen" />
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        <header className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white">
          <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-sm font-semibold text-slate-900">
            Gestão SST
          </span>
          <div className="w-9" />
        </header>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="p-0 w-80">
            <SheetHeader className="px-4 py-3 border-b border-slate-200">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <Sidebar onNavigate={() => setOpen(false)} className="border-r-0" />
          </SheetContent>
        </Sheet>

        <main>{children}</main>
      </div>
    </div>
  );
}
