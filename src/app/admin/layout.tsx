import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    redirect("/login");
  }

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-h-screen lg:ml-60 pt-14 lg:pt-0">
          <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
