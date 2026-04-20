import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerAuthSession();
  redirect(session ? "/dashboard" : "/login");
}
