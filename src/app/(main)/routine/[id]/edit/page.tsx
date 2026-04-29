import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getRoutineById } from "@/lib/queries/routines";
import { RoutineForm } from "@/components/routine/RoutineForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRoutinePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const routine = await getRoutineById(supabase, id);
  if (!routine || routine.user_id !== user.id) notFound();

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/routine" className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">루틴 수정</h1>
      </div>
      <RoutineForm routine={routine} userId={user.id} />
    </div>
  );
}
