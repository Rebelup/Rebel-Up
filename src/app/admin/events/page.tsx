import { createClient } from "@/lib/supabase/server";
import { getAllEvents, getAllBrands } from "@/lib/queries/events";
import { EventManager } from "@/components/admin/EventManager";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const [events, brands] = await Promise.all([
    getAllEvents(supabase).catch(() => []),
    getAllBrands(supabase).catch(() => []),
  ]);

  return <EventManager initialEvents={events} initialBrands={brands} />;
}
