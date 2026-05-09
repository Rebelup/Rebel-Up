import { SupabaseClient } from "@supabase/supabase-js";
import { SupplementBrand, SupplementEvent } from "@/lib/types";

export async function getBrands(supabase: SupabaseClient): Promise<SupplementBrand[]> {
  const { data, error } = await supabase
    .from("supplement_brands")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data as SupplementBrand[]) ?? [];
}

export async function getAllBrands(supabase: SupabaseClient): Promise<SupplementBrand[]> {
  const { data, error } = await supabase
    .from("supplement_brands")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data as SupplementBrand[]) ?? [];
}

export async function getActiveEvents(
  supabase: SupabaseClient,
  brandId?: string
): Promise<SupplementEvent[]> {
  let query = supabase
    .from("supplement_events")
    .select("*, supplement_brands(id, name, slug, logo_url)")
    .eq("is_active", true)
    .or("end_date.is.null,end_date.gte." + new Date().toISOString().split("T")[0])
    .order("created_at", { ascending: false });

  if (brandId) query = query.eq("brand_id", brandId);

  const { data, error } = await query;
  if (error) throw error;
  return (data as SupplementEvent[]) ?? [];
}

export async function getAllEvents(supabase: SupabaseClient): Promise<SupplementEvent[]> {
  const { data, error } = await supabase
    .from("supplement_events")
    .select("*, supplement_brands(id, name, slug, logo_url)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as SupplementEvent[]) ?? [];
}

export async function createEvent(
  supabase: SupabaseClient,
  payload: Omit<SupplementEvent, "id" | "created_at" | "updated_at" | "supplement_brands">
): Promise<SupplementEvent> {
  const { data, error } = await supabase
    .from("supplement_events")
    .insert(payload)
    .select("*, supplement_brands(id, name, slug, logo_url)")
    .single();
  if (error) throw error;
  return data as SupplementEvent;
}

export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<Omit<SupplementEvent, "id" | "created_at" | "updated_at" | "supplement_brands">>
): Promise<void> {
  const { error } = await supabase.from("supplement_events").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("supplement_events").delete().eq("id", id);
  if (error) throw error;
}

export async function createBrand(
  supabase: SupabaseClient,
  payload: Omit<SupplementBrand, "id" | "created_at">
): Promise<SupplementBrand> {
  const { data, error } = await supabase
    .from("supplement_brands")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as SupplementBrand;
}

export async function updateBrand(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<Omit<SupplementBrand, "id" | "created_at">>
): Promise<void> {
  const { error } = await supabase.from("supplement_brands").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteBrand(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("supplement_brands").delete().eq("id", id);
  if (error) throw error;
}
