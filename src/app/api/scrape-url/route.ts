import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url = body?.url;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RebelUpBot/1.0; +https://rebel-up.com)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    const html = await res.text();

    const getMeta = (property: string): string | null => {
      const patterns = [
        new RegExp(
          `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
          "i"
        ),
        new RegExp(
          `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
          "i"
        ),
        new RegExp(
          `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
          "i"
        ),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].trim();
      }
      return null;
    };

    const title =
      getMeta("og:title") ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
      null;

    return NextResponse.json({
      title,
      description: getMeta("og:description") ?? getMeta("description"),
      image_url: getMeta("og:image"),
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
