"use client";

import ColaboradorProfile from "@/components/colaboradores/ColaboradorProfile";
import { useParams } from "next/navigation";

export default function ColaboradorProfilePage() {
  const params = useParams<{ id: string }>();
  return <ColaboradorProfile id={params.id} />;
}
