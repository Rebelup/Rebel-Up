import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guessEventType } from "@/lib/crawl";
import type { ScrapedEvent } from "@/lib/crawl";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { events, brand_id } = body as { events?: ScrapedEvent[]; brand_id?: string };

  if (!events?.length || !brand_id) {
    return NextResponse.json({ error: "events와 brand_id가 필요해요." }, { status: 400 });
  }

  const supabase = createAdminClient();
  let saved = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const ev of events) {
    if (!ev.title || ev.title.length < 2) continue;

    const { data: existing } = await supabase
      .from("supplement_events")
      .select("id")
      .eq("brand_id", brand_id)
      .eq("title", ev.title)
      .maybeSingle();

    if (existing) { skipped++; continue; }

    const { error } = await supabase.from("supplement_events").insert({
      brand_id,
      title: ev.title,
      description: ev.description,
      image_url: ev.image_url,
      event_url: ev.event_url,
      discount_rate: ev.discount_rate,
      start_date: ev.start_date,
      end_date: ev.end_date,
      event_type: guessEventType(ev.title, ev.description),
      source: "scraped",
      is_active: true,
      is_international: false,
    });

    if (error) errors.push(ev.title);
    else saved++;
  }

  return NextResponse.json({ saved, skipped, errors });
}
