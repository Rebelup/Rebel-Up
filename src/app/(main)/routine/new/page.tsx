import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RoutineForm } from "@/components/routine/RoutineForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewRoutinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/routine" className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">새 루틴 추가</h1>
      </div>
      <RoutineForm userId={user.id} />
    </div>
  );
}
