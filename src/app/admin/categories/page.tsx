import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries/categories";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const categories = await getCategories(supabase);

  return <CategoryManager initialCategories={categories} />;
}
