"use client";

import { useState } from "react";
import { SupplementBrand, SupplementEvent, EventType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { createEvent, updateEvent, deleteEvent, createBrand, updateBrand, deleteBrand } from "@/lib/queries/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Link2, Loader2, RefreshCw, Check, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "sale", label: "할인" },
  { value: "new_product", label: "신제품" },
  { value: "bundle", label: "묶음" },
  { value: "free_shipping", label: "무료배송" },
  { value: "other", label: "기타" },
];

interface EventForm {
  brand_id: string; title: string; description: string; event_url: string;
  image_url: string; start_date: string; end_date: string; discount_rate: string;
  event_type: EventType; source: "manual" | "scraped"; is_active: boolean; is_international: boolean;
}

const EMPTY_FORM: EventForm = {
  brand_id: "", title: "", description: "", event_url: "", image_url: "",
  start_date: "", end_date: "", discount_rate: "", event_type: "sale",
  source: "manual", is_active: true, is_international: false,
};

interface ScrapedEvent {
  title: string; description: string | null; image_url: string | null;
  event_url: string; discount_rate: number | null; start_date: string | null; end_date: string | null;
}

interface Props {
  initialEvents: SupplementEvent[];
  initialBrands: SupplementBrand[];
}

function ImagePreview({ url, className }: { url: string; className?: string }) {
  const [error, setError] = useState(false);
  if (!url || error) {
    return (
      <div className={cn("bg-muted flex items-center justify-center rounded-xl", className)}>
        <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <div className={cn("relative rounded-xl overflow-hidden bg-muted", className)}>
      <Image src={url} alt="" fill className="object-cover" sizes="200px" onError={() => setError(true)} />
    </div>
  );
}

export function EventManager({ initialEvents, initialBrands }: Props) {
  const [supabase] = useState(() => createClient());
  const [tab, setTab] = useState<"events" | "brands">("events");

  const [events, setEvents] = useState<SupplementEvent[]>(initialEvents);
  const [eventOpen, setEventOpen] = useState(false);
  const [editEv, setEditEv] = useState<SupplementEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [scrapeOpen, setScrapeOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  const [brands, setBrands] = useState<SupplementBrand[]>(initialBrands);
  const [brandOpen, setBrandOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<SupplementBrand | null>(null);
  const [bForm, setBForm] = useState({ name: "", slug: "", website_url: "", events_url: "", logo_url: "", is_active: true });
  const [bSaving, setBSaving] = useState(false);

  const [crawlBrandId, setCrawlBrandId] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [crawlResults, setCrawlResults] = useState<ScrapedEvent[]>([]);
  const [crawlDialogOpen, setCrawlDialogOpen] = useState(false);
  const [selectedCrawl, setSelectedCrawl] = useState<Set<number>>(new Set());

  const handleScrapeUrl = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scrapeUrl }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm((f) => ({ ...f, title: data.title ?? f.title, description: data.description ?? f.description, image_url: data.image_url ?? f.image_url, event_url: scrapeUrl }));
      setScrapeOpen(false);
      setEventOpen(true);
      toast.success("URL 정보를 가져왔어요.");
    } catch { toast.error("URL을 불러오지 못했어요."); }
    finally { setScraping(false); }
  };

  const handleCrawl = async (brandId: string) => {
    setCrawlBrandId(brandId);
    setCrawling(true);
    setCrawlResults([]);
    setSelectedCrawl(new Set());
    setCrawlDialogOpen(true);
    try {
      const res = await fetch("/api/crawl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brand_id: brandId }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCrawlResults(data.events ?? []);
      if ((data.events ?? []).length === 0) toast.info("크롤링 결과가 없어요.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "크롤링 실패"); }
    finally { setCrawling(false); }
  };

  const saveCrawledEvents = async () => {
    const toSave = crawlResults.filter((_, i) => selectedCrawl.has(i));
    if (!crawlBrandId || toSave.length === 0) return;
    try {
      for (const ev of toSave) {
        const created = await createEvent(supabase, {
          brand_id: crawlBrandId, title: ev.title, description: ev.description,
          event_url: ev.event_url, image_url: ev.image_url, start_date: ev.start_date,
          end_date: ev.end_date, discount_rate: ev.discount_rate, event_type: "sale",
          source: "scraped", is_active: true,
          is_international: !["rexki", "daily", "samdae500"].includes(brands.find((b) => b.id === crawlBrandId)?.slug ?? ""),
        });
        setEvents((p) => [created, ...p]);
      }
      toast.success(`${toSave.length}개 이벤트가 저장됐어요.`);
      setCrawlDialogOpen(false);
    } catch { toast.error("저장에 실패했습니다."); }
  };

  const openAdd = () => { setEditEv(null); setForm(EMPTY_FORM); setEventOpen(true); };
  const openEdit = (ev: SupplementEvent) => {
    setEditEv(ev);
    setForm({
      brand_id: ev.brand_id, title: ev.title, description: ev.description ?? "",
      event_url: ev.event_url ?? "", image_url: ev.image_url ?? "",
      start_date: ev.start_date ?? "", end_date: ev.end_date ?? "",
      discount_rate: ev.discount_rate != null ? String(ev.discount_rate) : "",
      event_type: ev.event_type, source: ev.source, is_active: ev.is_active, is_international: ev.is_international,
    });
    setEventOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand_id || !form.title.trim()) return;
    setSaving(true);
    const payload = {
      brand_id: form.brand_id, title: form.title.trim(), description: form.description.trim() || null,
      event_url: form.event_url.trim() || null, image_url: form.image_url.trim() || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      discount_rate: form.discount_rate ? Number(form.discount_rate) : null,
      event_type: form.event_type, source: form.source, is_active: form.is_active, is_international: form.is_international,
    };
    try {
      if (editEv) {
        await updateEvent(supabase, editEv.id, payload);
        setEvents((p) => p.map((ev) => ev.id === editEv.id ? { ...ev, ...payload, supplement_brands: brands.find((b) => b.id === payload.brand_id) ? { id: payload.brand_id, name: brands.find((b) => b.id === payload.brand_id)!.name, slug: brands.find((b) => b.id === payload.brand_id)!.slug, logo_url: brands.find((b) => b.id === payload.brand_id)!.logo_url } : ev.supplement_brands } : ev));
        toast.success("수정됐어요.");
      } else {
        const created = await createEvent(supabase, payload);
        setEvents((p) => [created, ...p]);
        toast.success("추가됐어요.");
      }
      setEventOpen(false);
    } catch (err) { toast.error(err instanceof Error ? err.message : "다시 시도해주세요."); }
    finally { setSaving(false); }
  };

  const toggleActive = async (ev: SupplementEvent) => {
    try { await updateEvent(supabase, ev.id, { is_active: !ev.is_active }); setEvents((p) => p.map((e) => e.id === ev.id ? { ...e, is_active: !e.is_active } : e)); }
    catch { toast.error("변경 실패"); }
  };

  const handleDelete = async (ev: SupplementEvent) => {
    if (!confirm(`"${ev.title}" 삭제할까요?`)) return;
    try { await deleteEvent(supabase, ev.id); setEvents((p) => p.filter((e) => e.id !== ev.id)); toast.success("삭제됐어요."); }
    catch { toast.error("삭제 실패"); }
  };

  const openAddBrand = () => { setEditBrand(null); setBForm({ name: "", slug: "", website_url: "", events_url: "", logo_url: "", is_active: true }); setBrandOpen(true); };
  const openEditBrand = (b: SupplementBrand) => { setEditBrand(b); setBForm({ name: b.name, slug: b.slug, website_url: b.website_url ?? "", events_url: b.events_url ?? "", logo_url: b.logo_url ?? "", is_active: b.is_active }); setBrandOpen(true); };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bForm.name.trim() || !bForm.slug.trim()) return;
    setBSaving(true);
    const payload = { name: bForm.name.trim(), slug: bForm.slug.trim().toLowerCase().replace(/\s+/g, "-"), website_url: bForm.website_url.trim() || null, events_url: bForm.events_url.trim() || null, logo_url: bForm.logo_url.trim() || null, is_active: bForm.is_active };
    try {
      if (editBrand) { await updateBrand(supabase, editBrand.id, payload); setBrands((p) => p.map((b) => b.id === editBrand.id ? { ...b, ...payload } : b)); toast.success("수정됐어요."); }
      else { const created = await createBrand(supabase, payload); setBrands((p) => [...p, created]); toast.success("추가됐어요."); }
      setBrandOpen(false);
    } catch (err) { toast.error(err instanceof Error ? err.message : "다시 시도해주세요."); }
    finally { setBSaving(false); }
  };

  const handleDeleteBrand = async (b: SupplementBrand) => {
    if (!confirm(`"${b.name}" 삭제? 이 브랜드의 이벤트도 삭제됩니다.`)) return;
    try { await deleteBrand(supabase, b.id); setBrands((p) => p.filter((br) => br.id !== b.id)); setEvents((p) => p.filter((ev) => ev.brand_id !== b.id)); toast.success("삭제됐어요."); }
    catch { toast.error("삭제 실패"); }
  };

  const bName = (id: string) => brands.find((b) => b.id === id)?.name ?? "-";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">이벤트 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">보충제 브랜드 이벤트를 관리하세요.</p>
      </div>

      <div className="flex border-b border-border">
        {(["events", "brands"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t === "events" ? `이벤트 (${events.length})` : `브랜드 (${brands.length})`}
          </button>
        ))}
      </div>

      {/* ── 이벤트 탭 ── */}
      {tab === "events" && (
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Dialog open={scrapeOpen} onOpenChange={setScrapeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Link2 className="w-4 h-4" />URL로 가져오기</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>URL로 이벤트 가져오기</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>이벤트 페이지 URL</Label>
                    <Input value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} placeholder="https://..." type="url" />
                    <p className="text-xs text-muted-foreground">제목·설명·이미지를 자동으로 가져옵니다.</p>
                  </div>
                  <Button onClick={handleScrapeUrl} disabled={scraping || !scrapeUrl.trim()} className="w-full gap-2">
                    {scraping && <Loader2 className="w-4 h-4 animate-spin" />}
                    {scraping ? "가져오는 중..." : "가져오기"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={eventOpen} onOpenChange={setEventOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />이벤트 추가</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editEv ? "이벤트 수정" : "이벤트 추가"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>브랜드 *</Label>
                    <select required value={form.brand_id} onChange={(e) => setForm((f) => ({ ...f, brand_id: e.target.value }))} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">선택</option>
                      {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>제목 *</Label>
                    <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="예: 여름맞이 30% 할인" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>설명</Label>
                    <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>종류</Label>
                      <select value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value as EventType }))} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                        {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>할인율 (%)</Label>
                      <Input type="number" min={0} max={100} value={form.discount_rate} onChange={(e) => setForm((f) => ({ ...f, discount_rate: e.target.value }))} placeholder="예: 30" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>시작일</Label><Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>종료일</Label><Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1.5"><Label>이벤트 URL</Label><Input type="url" value={form.event_url} onChange={(e) => setForm((f) => ({ ...f, event_url: e.target.value }))} placeholder="https://..." /></div>

                  {/* 이미지 URL + 미리보기 */}
                  <div className="space-y-2">
                    <Label>썸네일 이미지 URL</Label>
                    <Input
                      type="url"
                      value={form.image_url}
                      onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    {form.image_url && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
                        <ImagePreview url={form.image_url} className="absolute inset-0 w-full h-full rounded-none" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
                      <span className="text-sm">공개</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_international} onChange={(e) => setForm((f) => ({ ...f, is_international: e.target.checked }))} className="w-4 h-4" />
                      <span className="text-sm">해외배송 상품</span>
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "저장 중..." : editEv ? "수정하기" : "추가하기"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {events.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">이벤트가 없어요.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-16">이미지</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">이벤트</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">기간</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <ImagePreview url={ev.image_url ?? ""} className="w-12 h-12" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{bName(ev.brand_id)}{ev.is_international && " · 해외"}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">{ev.end_date ? `~ ${new Date(ev.end_date).toLocaleDateString("ko-KR")}` : "기간 없음"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(ev)} className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium", ev.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500")}>
                          {ev.is_active ? <><Eye className="w-3 h-3" />공개</> : <><EyeOff className="w-3 h-3" />숨김</>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(ev)} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(ev)} className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── 브랜드 탭 ── */}
      {tab === "brands" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={brandOpen} onOpenChange={setBrandOpen}>
              <DialogTrigger asChild><Button onClick={openAddBrand} className="gap-2"><Plus className="w-4 h-4" />브랜드 추가</Button></DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>{editBrand ? "브랜드 수정" : "브랜드 추가"}</DialogTitle></DialogHeader>
                <form onSubmit={handleBrandSubmit} className="space-y-4 mt-2">
                  <div className="space-y-1.5"><Label>브랜드명 *</Label><Input required value={bForm.name} onChange={(e) => setBForm((f) => ({ ...f, name: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>슬러그 *</Label><Input required value={bForm.slug} onChange={(e) => setBForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} /></div>
                  <div className="space-y-1.5"><Label>공식 사이트 URL</Label><Input type="url" value={bForm.website_url} onChange={(e) => setBForm((f) => ({ ...f, website_url: e.target.value }))} placeholder="https://..." /></div>
                  <div className="space-y-1.5"><Label>이벤트 URL (크롤링용)</Label><Input type="url" value={bForm.events_url} onChange={(e) => setBForm((f) => ({ ...f, events_url: e.target.value }))} placeholder="https://.../promotions" /></div>
                  <div className="space-y-1.5">
                    <Label>로고 URL</Label>
                    <Input type="url" value={bForm.logo_url} onChange={(e) => setBForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
                    {bForm.logo_url && <ImagePreview url={bForm.logo_url} className="w-16 h-16 mt-1" />}
                  </div>
                  <Button type="submit" className="w-full" disabled={bSaving}>{bSaving ? "저장 중..." : editBrand ? "수정" : "추가"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {brands.length === 0 ? <div className="py-16 text-center text-muted-foreground text-sm">브랜드가 없어요.</div> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30"><th className="text-left px-4 py-3 font-medium text-muted-foreground">브랜드</th><th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">이벤트 URL</th><th className="text-right px-4 py-3 font-medium text-muted-foreground">관리</th></tr></thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{b.name}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {b.events_url ? <span className="text-xs text-muted-foreground truncate block max-w-xs">{b.events_url}</span> : <span className="text-xs text-muted-foreground">미설정</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {b.events_url && (
                            <Button variant="outline" size="sm" onClick={() => handleCrawl(b.id)} className="h-8 gap-1.5 text-xs">
                              <RefreshCw className="w-3 h-3" />크롤링
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEditBrand(b)} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteBrand(b)} className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── 크롤링 결과 다이얼로그 ── */}
      <Dialog open={crawlDialogOpen} onOpenChange={setCrawlDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>크롤링 결과 — {brands.find((b) => b.id === crawlBrandId)?.name}</DialogTitle>
          </DialogHeader>
          {crawling ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">크롤링 중...</p>
            </div>
          ) : crawlResults.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              결과가 없어요. 해당 사이트는 직접 입력이 필요해요.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{crawlResults.length}개 발견. 저장할 항목을 선택하세요.</p>
              {crawlResults.map((ev, i) => (
                <div key={i} onClick={() => setSelectedCrawl((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })} className={cn("p-3 rounded-xl border cursor-pointer transition-colors flex gap-3", selectedCrawl.has(i) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30")}>
                  {ev.image_url && (
                    <ImagePreview url={ev.image_url} className="w-14 h-14 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className={cn("mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center", selectedCrawl.has(i) ? "bg-primary border-primary" : "border-border")}>
                        {selectedCrawl.has(i) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{ev.title}</p>
                        {ev.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ev.description}</p>}
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          {ev.discount_rate && <span className="text-rose-500 font-bold">▼{ev.discount_rate}%</span>}
                          {ev.end_date && <span>~ {ev.end_date}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={saveCrawledEvents} disabled={selectedCrawl.size === 0} className="w-full">
                선택한 {selectedCrawl.size}개 저장
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
