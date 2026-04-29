import { createClient } from "@/lib/supabase/server";
import { getAllUsers } from "@/lib/queries/users";
import { UserManager } from "@/components/admin/UserManager";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const [{ data: { user } }, users] = await Promise.all([
    supabase.auth.getUser(),
    getAllUsers(supabase, {}),
  ]);

  return <UserManager initialUsers={users} currentUserId={user!.id} />;
}
