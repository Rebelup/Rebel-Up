import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/queries/users";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfileById(supabase, user.id);
  if (!profile || profile.role !== "admin") redirect("/feed");

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-h-screen lg:ml-60">
          <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
