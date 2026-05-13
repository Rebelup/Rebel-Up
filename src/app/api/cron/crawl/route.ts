import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crawlUrl, guessEventType } from "@/lib/crawl";

const INTERNATIONAL_SLUGS = new Set([
  "on", "gnc", "muscletech", "musclepharm", "myprotein", "bsn", "nowfoods",
]);

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel Cron 인증
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // events_url이 있는 모든 브랜드 조회
  const { data: brands, error } = await supabase
    .from("supplement_brands")
    .select("*")
    .not("events_url", "is", null);

  if (error || !brands?.length) {
    return NextResponse.json({ message: "크롤할 브랜드 없음", error });
  }

  const results: Array<{
    brand: string;
    found?: number;
    saved?: number;
    skipped?: number;
    error?: string;
  }> = [];

  for (const brand of brands) {
    try {
      const scraped = await crawlUrl(brand.events_url);
      let saved = 0;
      let skipped = 0;

      for (const ev of scraped) {
        if (!ev.title || ev.title.length < 3) continue;

        // 같은 브랜드에 동일 제목 이벤트가 이미 있으면 스킵
        const { data: existing } = await supabase
          .from("supplement_events")
          .select("id")
          .eq("brand_id", brand.id)
          .eq("title", ev.title)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const { error: insertErr } = await supabase.from("supplement_events").insert({
          brand_id: brand.id,
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
          is_international: INTERNATIONAL_SLUGS.has(brand.slug),
        });

        if (!insertErr) saved++;
      }

      results.push({ brand: brand.name, found: scraped.length, saved, skipped });
    } catch (err) {
      results.push({
        brand: brand.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log("[cron/crawl]", new Date().toISOString(), results);
  return NextResponse.json({ crawled_at: new Date().toISOString(), results });
}
