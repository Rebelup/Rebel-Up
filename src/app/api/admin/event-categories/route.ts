import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const { data, error } = await createAdminClient()
    .from("event_categories")
    .select("*")
    .order("display_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, slug, parent_id, display_order } = body;
  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "name과 slug는 필수입니다." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("event_categories")
    .insert({ name: name.trim(), slug: slug.trim(), parent_id: parent_id ?? null, display_order: display_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
