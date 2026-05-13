import { createClient } from "@/lib/supabase/server";
import { getAllUsers } from "@/lib/queries/users";
import { UserManager } from "@/components/admin/UserManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const [{ data: { user } }, users] = await Promise.all([
    supabase.auth.getUser(),
    getAllUsers(supabase, {}).catch(() => []),
  ]);

  return <UserManager initialUsers={users} currentUserId={user?.id ?? ""} />;
}
