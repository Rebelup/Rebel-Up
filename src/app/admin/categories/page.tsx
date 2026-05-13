import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries/categories";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase).catch(() => []);

  return <CategoryManager initialCategories={categories} />;
}
