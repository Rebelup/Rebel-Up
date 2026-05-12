import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { crawlUrl } from "@/lib/crawl";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { brand_id } = body as { brand_id?: string };
  if (!brand_id) return NextResponse.json({ error: "brand_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: brand } = await supabase
    .from("supplement_brands")
    .select("*")
    .eq("id", brand_id)
    .single();

  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  if (!brand.events_url)
    return NextResponse.json({ error: "이 브랜드에 이벤트 URL이 없어요." }, { status: 400 });

  try {
    const events = await crawlUrl(brand.events_url);
    return NextResponse.json({
      brand_id,
      brand_name: brand.name,
      events_url: brand.events_url,
      found: events.length,
      events,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `크롤링 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}` },
      { status: 500 }
    );
  }
}
