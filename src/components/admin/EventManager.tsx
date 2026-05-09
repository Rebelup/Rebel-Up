"use client";

import { useState } from "react";
import { SupplementBrand, SupplementEvent, EventType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  createBrand,
  updateBrand,
  deleteBrand,
} from "@/lib/queries/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Link2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "sale", label: "할인" },
  { value: "new_product", label: "신제품" },
  { value: "bundle", label: "묶음" },
  { value: "free_shipping", label: "무료배송" },
  { value: "other", label: "기타" },
];

interface EventForm {
  brand_id: string;
  title: string;
  description: string;
  event_url: string;
  image_url: string;
  start_date: string;
  end_date: string;
  discount_rate: string;
  event_type: EventType;
  source: "manual" | "scraped";
  is_active: boolean;
}

const EMPTY_EVENT_FORM: EventForm = {
  brand_id: "",
  title: "",
  description: "",
  event_url: "",
  image_url: "",
  start_date: "",
  end_date: "",
  discount_rate: "",
  event_type: "sale",
  source: "manual",
  is_active: true,
};

const EMPTY_BRAND_FORM = {
  name: "",
  slug: "",
  website_url: "",
  events_url: "",
  logo_url: "",
  is_active: true,
};

interface Props {
  initialEvents: SupplementEvent[];
  initialBrands: SupplementBrand[];
}

export function EventManager({ initialEvents, initialBrands }: Props) {
  const [supabase] = useState(() => createClient());
  const [activeTab, setActiveTab] = useState<"events" | "brands">("events");

  // Events state
  const [events, setEvents] = useState<SupplementEvent[]>(initialEvents);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<SupplementEvent | null>(null);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [eventSubmitting, setEventSubmitting] = useState(false);

  // URL scraping
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scraping, setScraping] = useState(false);

  // Brands state
  const [brands, setBrands] = useState<SupplementBrand[]>(initialBrands);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<SupplementBrand | null>(null);
  const [brandForm, setBrandForm] = useState(EMPTY_BRAND_FORM);
  const [brandSubmitting, setBrandSubmitting] = useState(false);

  // ─── URL scraping ───────────────────────────────────────
  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEventForm((f) => ({
        ...f,
        title: data.title ?? f.title,
        description: data.description ?? f.description,
        image_url: data.image_url ?? f.image_url,
        event_url: scrapeUrl,
      }));
      setScrapeDialogOpen(false);
      setEventDialogOpen(true);
      toast.success("URL에서 정보를 가져왔어요. 내용을 확인하고 저장하세요.");
    } catch {
      toast.error("URL을 불러오지 못했어요.");
    } finally {
      setScraping(false);
    }
  };

  // ─── Events CRUD ─────────────────────────────────────────
  const openAddEvent = () => {
    setEditEvent(null);
    setEventForm(EMPTY_EVENT_FORM);
    setEventDialogOpen(true);
  };

  const openEditEvent = (ev: SupplementEvent) => {
    setEditEvent(ev);
    setEventForm({
      brand_id: ev.brand_id,
      title: ev.title,
      description: ev.description ?? "",
      event_url: ev.event_url ?? "",
      image_url: ev.image_url ?? "",
      start_date: ev.start_date ?? "",
      end_date: ev.end_date ?? "",
      discount_rate: ev.discount_rate != null ? String(ev.discount_rate) : "",
      event_type: ev.event_type,
      source: ev.source,
      is_active: ev.is_active,
    });
    setEventDialogOpen(true);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.brand_id || !eventForm.title.trim()) return;
    setEventSubmitting(true);

    const payload = {
      brand_id: eventForm.brand_id,
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || null,
      event_url: eventForm.event_url.trim() || null,
      image_url: eventForm.image_url.trim() || null,
      start_date: eventForm.start_date || null,
      end_date: eventForm.end_date || null,
      discount_rate: eventForm.discount_rate ? Number(eventForm.discount_rate) : null,
      event_type: eventForm.event_type,
      source: eventForm.source,
      is_active: eventForm.is_active,
    };

    try {
      if (editEvent) {
        await updateEvent(supabase, editEvent.id, payload);
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === editEvent.id
              ? {
                  ...ev,
                  ...payload,
                  supplement_brands: brands
                    .find((b) => b.id === payload.brand_id)
                    ? {
                        id: payload.brand_id,
                        name: brands.find((b) => b.id === payload.brand_id)!.name,
                        slug: brands.find((b) => b.id === payload.brand_id)!.slug,
                        logo_url: brands.find((b) => b.id === payload.brand_id)!.logo_url,
                      }
                    : ev.supplement_brands,
                }
              : ev
          )
        );
        toast.success("이벤트가 수정됐어요.");
      } else {
        const created = await createEvent(supabase, payload);
        setEvents((prev) => [created, ...prev]);
        toast.success("이벤트가 추가됐어요.");
      }
      setEventDialogOpen(false);
    } catch (err: unknown) {
      toast.error(`오류: ${err instanceof Error ? err.message : "다시 시도해주세요."}`);
    } finally {
      setEventSubmitting(false);
    }
  };

  const toggleEventActive = async (ev: SupplementEvent) => {
    try {
      await updateEvent(supabase, ev.id, { is_active: !ev.is_active });
      setEvents((prev) =>
        prev.map((e) => (e.id === ev.id ? { ...e, is_active: !e.is_active } : e))
      );
    } catch {
      toast.error("변경에 실패했습니다.");
    }
  };

  const handleDeleteEvent = async (ev: SupplementEvent) => {
    if (!confirm(`"${ev.title}" 이벤트를 삭제할까요?`)) return;
    try {
      await deleteEvent(supabase, ev.id);
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
      toast.success("이벤트가 삭제됐어요.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  // ─── Brands CRUD ─────────────────────────────────────────
  const openAddBrand = () => {
    setEditBrand(null);
    setBrandForm(EMPTY_BRAND_FORM);
    setBrandDialogOpen(true);
  };

  const openEditBrand = (b: SupplementBrand) => {
    setEditBrand(b);
    setBrandForm({
      name: b.name,
      slug: b.slug,
      website_url: b.website_url ?? "",
      events_url: b.events_url ?? "",
      logo_url: b.logo_url ?? "",
      is_active: b.is_active,
    });
    setBrandDialogOpen(true);
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name.trim() || !brandForm.slug.trim()) return;
    setBrandSubmitting(true);

    const payload = {
      name: brandForm.name.trim(),
      slug: brandForm.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      website_url: brandForm.website_url.trim() || null,
      events_url: brandForm.events_url.trim() || null,
      logo_url: brandForm.logo_url.trim() || null,
      is_active: brandForm.is_active,
    };

    try {
      if (editBrand) {
        await updateBrand(supabase, editBrand.id, payload);
        setBrands((prev) =>
          prev.map((b) => (b.id === editBrand.id ? { ...b, ...payload } : b))
        );
        toast.success("브랜드가 수정됐어요.");
      } else {
        const created = await createBrand(supabase, payload);
        setBrands((prev) => [...prev, created]);
        toast.success("브랜드가 추가됐어요.");
      }
      setBrandDialogOpen(false);
    } catch (err: unknown) {
      toast.error(`오류: ${err instanceof Error ? err.message : "다시 시도해주세요."}`);
    } finally {
      setBrandSubmitting(false);
    }
  };

  const handleDeleteBrand = async (b: SupplementBrand) => {
    if (!confirm(`"${b.name}" 브랜드를 삭제할까요?\n해당 브랜드의 이벤트도 모두 삭제됩니다.`)) return;
    try {
      await deleteBrand(supabase, b.id);
      setBrands((prev) => prev.filter((brand) => brand.id !== b.id));
      setEvents((prev) => prev.filter((ev) => ev.brand_id !== b.id));
      toast.success("브랜드가 삭제됐어요.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? "-";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">이벤트 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">보충제 브랜드 이벤트를 관리하세요.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["events", "brands"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "events" ? `이벤트 (${events.length})` : `브랜드 (${brands.length})`}
          </button>
        ))}
      </div>

      {/* ── Events tab ── */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            {/* URL 가져오기 */}
            <Dialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Link2 className="w-4 h-4" />
                  URL로 가져오기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>URL로 이벤트 가져오기</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>이벤트 페이지 URL</Label>
                    <Input
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      placeholder="https://..."
                      type="url"
                    />
                    <p className="text-xs text-muted-foreground">
                      페이지의 제목, 설명, 이미지를 자동으로 가져옵니다.
                    </p>
                  </div>
                  <Button
                    onClick={handleScrape}
                    disabled={scraping || !scrapeUrl.trim()}
                    className="w-full gap-2"
                  >
                    {scraping && <Loader2 className="w-4 h-4 animate-spin" />}
                    {scraping ? "가져오는 중..." : "가져오기"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* 직접 추가 */}
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddEvent} className="gap-2">
                  <Plus className="w-4 h-4" />
                  이벤트 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editEvent ? "이벤트 수정" : "이벤트 추가"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEventSubmit} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>브랜드 *</Label>
                    <select
                      required
                      value={eventForm.brand_id}
                      onChange={(e) => setEventForm((f) => ({ ...f, brand_id: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">브랜드 선택</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>이벤트 제목 *</Label>
                    <Input
                      required
                      value={eventForm.title}
                      onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="예: 여름맞이 최대 30% 할인"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>설명</Label>
                    <Textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="이벤트 상세 설명"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>이벤트 종류</Label>
                      <select
                        value={eventForm.event_type}
                        onChange={(e) =>
                          setEventForm((f) => ({ ...f, event_type: e.target.value as EventType }))
                        }
                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {EVENT_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>할인율 (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={eventForm.discount_rate}
                        onChange={(e) =>
                          setEventForm((f) => ({ ...f, discount_rate: e.target.value }))
                        }
                        placeholder="예: 30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>시작일</Label>
                      <Input
                        type="date"
                        value={eventForm.start_date}
                        onChange={(e) =>
                          setEventForm((f) => ({ ...f, start_date: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>종료일</Label>
                      <Input
                        type="date"
                        value={eventForm.end_date}
                        onChange={(e) =>
                          setEventForm((f) => ({ ...f, end_date: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>이벤트 URL</Label>
                    <Input
                      type="url"
                      value={eventForm.event_url}
                      onChange={(e) => setEventForm((f) => ({ ...f, event_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>이미지 URL</Label>
                    <Input
                      type="url"
                      value={eventForm.image_url}
                      onChange={(e) => setEventForm((f) => ({ ...f, image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={eventForm.is_active}
                      onChange={(e) =>
                        setEventForm((f) => ({ ...f, is_active: e.target.checked }))
                      }
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      공개 (체크 해제 시 숨김)
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={eventSubmitting}>
                    {eventSubmitting ? "저장 중..." : editEvent ? "수정하기" : "추가하기"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Events table */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {events.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                등록된 이벤트가 없어요.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">이벤트</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">브랜드</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">기간</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{brandName(ev.brand_id)}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {brandName(ev.brand_id)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                        {ev.end_date
                          ? `~ ${new Date(ev.end_date).toLocaleDateString("ko-KR")}`
                          : "기간 없음"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleEventActive(ev)}
                          className={cn(
                            "flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors",
                            ev.is_active
                              ? "bg-green-50 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          )}
                        >
                          {ev.is_active ? (
                            <><Eye className="w-3 h-3" />공개</>
                          ) : (
                            <><EyeOff className="w-3 h-3" />숨김</>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditEvent(ev)}
                            className="h-8 w-8"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEvent(ev)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* ── Brands tab ── */}
      {activeTab === "brands" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddBrand} className="gap-2">
                  <Plus className="w-4 h-4" />
                  브랜드 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{editBrand ? "브랜드 수정" : "브랜드 추가"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBrandSubmit} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>브랜드명 *</Label>
                    <Input
                      required
                      value={brandForm.name}
                      onChange={(e) => setBrandForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="예: Optimum Nutrition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>슬러그 *</Label>
                    <Input
                      required
                      value={brandForm.slug}
                      onChange={(e) =>
                        setBrandForm((f) => ({
                          ...f,
                          slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                        }))
                      }
                      placeholder="예: on"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>공식 사이트 URL</Label>
                    <Input
                      type="url"
                      value={brandForm.website_url}
                      onChange={(e) =>
                        setBrandForm((f) => ({ ...f, website_url: e.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>이벤트 페이지 URL</Label>
                    <Input
                      type="url"
                      value={brandForm.events_url}
                      onChange={(e) =>
                        setBrandForm((f) => ({ ...f, events_url: e.target.value }))
                      }
                      placeholder="https://.../promotions"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>로고 URL</Label>
                    <Input
                      type="url"
                      value={brandForm.logo_url}
                      onChange={(e) =>
                        setBrandForm((f) => ({ ...f, logo_url: e.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={brandSubmitting}>
                    {brandSubmitting ? "저장 중..." : editBrand ? "수정하기" : "추가하기"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {brands.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">
                등록된 브랜드가 없어요.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">브랜드</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">슬러그</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{b.name}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{b.slug}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditBrand(b)}
                            className="h-8 w-8"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBrand(b)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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
    </div>
  );
}
