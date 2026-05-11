import { createClient } from "@/lib/supabase/server";
import { getBrands, getActiveEvents } from "@/lib/queries/events";
import { EventsClient } from "@/components/events/EventsClient";
import { Dumbbell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createClient();
  const [brands, events] = await Promise.all([
    getBrands(supabase),
    getActiveEvents(supabase),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base">보충제 이벤트</span>
          <span className="ml-auto text-xs text-muted-foreground">{events.length}개</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        <EventsClient initialBrands={brands} initialEvents={events} />
      </div>
    </div>
  );
}
