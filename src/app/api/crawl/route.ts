import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { crawlUrl } from "@/lib/crawl";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { brand_id, url } = body as { brand_id?: string; url?: string };

  const supabase = await createClient();

  let eventsUrl: string;
  let brandName: string = "";

  if (url) {
    // 직접 URL 크롤
    eventsUrl = url;
  } else if (brand_id) {
    // 브랜드 ID로 크롤
    const { data: brand } = await supabase
      .from("supplement_brands")
      .select("*")
      .eq("id", brand_id)
      .single();
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    if (!brand.events_url)
      return NextResponse.json({ error: "이 브랜드에 이벤트 URL이 없어요." }, { status: 400 });
    eventsUrl = brand.events_url;
    brandName = brand.name;
  } else {
    return NextResponse.json({ error: "brand_id 또는 url이 필요해요." }, { status: 400 });
  }

  try {
    const events = await crawlUrl(eventsUrl);
    return NextResponse.json({
      brand_id: brand_id ?? null,
      brand_name: brandName,
      events_url: eventsUrl,
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
