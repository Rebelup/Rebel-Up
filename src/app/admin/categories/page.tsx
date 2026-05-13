import { createClient } from "@/lib/supabase/server";
import { getEventCategories } from "@/lib/queries/events";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const categories = await getEventCategories(supabase).catch(() => []);
  return <CategoryManager initialCategories={categories} />;
}
