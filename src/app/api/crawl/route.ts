import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ScrapedEvent {
  title: string;
  description: string | null;
  image_url: string | null;
  event_url: string;
  discount_rate: number | null;
  start_date: string | null;
  end_date: string | null;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function getMeta(html: string, prop: string): string | null {
  for (const re of [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']{3,})["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']{3,})["'][^>]+property=["']${prop}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']{3,})["']`, "i"),
  ]) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch {}
  }
  return results;
}

function extractDiscount(text: string): number | null {
  const m =
    text.match(/(\d+)\s*%\s*(off|할인|OFF|SALE|세일)/i) ||
    text.match(/(save|최대|up\s*to)\s*(\d+)\s*%/i);
  if (m) {
    const n = parseInt(m[1] ?? m[2]);
    if (n >= 5 && n <= 90) return n;
  }
  return null;
}

function extractDate(text: string): string | null {
  const m = text.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function cleanText(t: string) {
  return t.replace(/\s+/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

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
  if (!brand.events_url) return NextResponse.json({ error: "이 브랜드에 이벤트 URL이 없어요." }, { status: 400 });

  try {
    const html = await fetchHtml(brand.events_url);
    const events: ScrapedEvent[] = [];

    // 1. JSON-LD structured data
    const jsonLdItems = extractJsonLd(html);
    for (const item of jsonLdItems) {
      const type = item["@type"];
      if (!["SaleEvent", "Event", "Offer", "Product", "ItemList"].includes(String(type))) continue;
      const title = String(item.name ?? item.headline ?? "").trim();
      if (!title || title.length < 3) continue;
      events.push({
        title: cleanText(title),
        description: item.description ? cleanText(String(item.description)).slice(0, 500) : null,
        image_url: typeof item.image === "string" ? item.image : (item.image as Record<string, unknown>)?.url as string ?? null,
        event_url: brand.events_url,
        discount_rate: extractDiscount(title + " " + String(item.description ?? "")),
        start_date: extractDate(String(item.startDate ?? item.validFrom ?? "")),
        end_date: extractDate(String(item.endDate ?? item.validThrough ?? "")),
      });
    }

    // 2. og: / meta 태그 (fallback)
    if (events.length === 0) {
      const ogTitle = getMeta(html, "og:title") ?? html.match(/<title[^>]*>([^<]{3,})<\/title>/i)?.[1];
      const ogDesc = getMeta(html, "og:description") ?? getMeta(html, "description");
      const ogImage = getMeta(html, "og:image");

      if (ogTitle) {
        const title = cleanText(ogTitle);
        events.push({
          title,
          description: ogDesc ? cleanText(ogDesc).slice(0, 500) : null,
          image_url: ogImage ?? null,
          event_url: brand.events_url,
          discount_rate: extractDiscount(title + " " + (ogDesc ?? "")),
          start_date: null,
          end_date: null,
        });
      }
    }

    // 3. 제목/헤더 텍스트에서 프로모션 키워드 추출
    if (events.length < 3) {
      const headingRe = /<h[123][^>]*>([^<]{5,80})<\/h[123]>/gi;
      let hm;
      while ((hm = headingRe.exec(html)) !== null && events.length < 6) {
        const text = cleanText(hm[1]);
        const keywords = /sale|할인|특가|이벤트|프로모|promotion|off|%|신제품|new|launch/i;
        if (!keywords.test(text)) continue;
        if (events.some((e) => e.title === text)) continue;
        events.push({
          title: text,
          description: null,
          image_url: null,
          event_url: brand.events_url,
          discount_rate: extractDiscount(text),
          start_date: null,
          end_date: null,
        });
      }
    }

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
