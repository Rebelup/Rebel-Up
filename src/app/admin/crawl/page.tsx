import { createClient } from "@/lib/supabase/server";
import { getAllBrands } from "@/lib/queries/events";
import { CrawlManager } from "@/components/admin/CrawlManager";

export const dynamic = "force-dynamic";

export default async function AdminCrawlPage() {
  const supabase = await createClient();
  const brands = await getAllBrands(supabase);
  return <CrawlManager initialBrands={brands} />;
}
