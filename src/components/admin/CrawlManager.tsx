"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SupplementBrand } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Globe, Plus, Loader2, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Link as LinkIcon, RefreshCw, Save,
} from "lucide-react";

interface ScrapedEvent {
  title: string;
  description: string | null;
  image_url: string | null;
  event_url: string;
  discount_rate: number | null;
  start_date: string | null;
  end_date: string | null;
}

interface BrandCrawlState {
  loading: boolean;
  results: ScrapedEvent[] | null;
  error: string | null;
  selected: Set<number>;
  saving: boolean;
  saved: boolean;
  expanded: boolean;
  editingUrl: string;
  savingUrl: boolean;
}

const defaultState = (brand: SupplementBrand): BrandCrawlState => ({
  loading: false,
  results: null,
  error: null,
  selected: new Set(),
  saving: false,
  saved: false,
  expanded: false,
  editingUrl: brand.events_url ?? "",
  savingUrl: false,
});

export function CrawlManager({ initialBrands }: { initialBrands: SupplementBrand[] }) {
  const [brands, setBrands] = useState<SupplementBrand[]>(initialBrands);
  const [states, setStates] = useState<Record<string, BrandCrawlState>>(
    () => Object.fromEntries(initialBrands.map((b) => [b.id, defaultState(b)]))
  );

  // 새 브랜드 추가 폼
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const supabase = createClient();

  const patch = (id: string, update: Partial<BrandCrawlState>) =>
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...update } }));

  // URL 저장
  async function saveUrl(brand: SupplementBrand) {
    const url = states[brand.id].editingUrl.trim();
    if (!url) return;
    patch(brand.id, { savingUrl: true });
    const { error } = await supabase
      .from("supplement_brands")
      .update({ events_url: url })
      .eq("id", brand.id);
    if (!error) {
      setBrands((prev) => prev.map((b) => b.id === brand.id ? { ...b, events_url: url } : b));
    }
    patch(brand.id, { savingUrl: false });
  }

  // 크롤링 실행
  async function runCrawl(brand: SupplementBrand) {
    const url = states[brand.id].editingUrl.trim();
    if (!url) return;
    patch(brand.id, { loading: true, results: null, error: null, selected: new Set(), saved: false, expanded: true });
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brand.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "크롤링 실패");
      const results: ScrapedEvent[] = data.events ?? [];
      patch(brand.id, {
        loading: false,
        results,
        selected: new Set(results.map((_, i) => i)),
      });
    } catch (err) {
      patch(brand.id, { loading: false, error: String(err) });
    }
  }

  // 선택 저장
  async function saveSelected(brand: SupplementBrand) {
    const state = states[brand.id];
    if (!state.results) return;
    const toSave = state.results.filter((_, i) => state.selected.has(i));
    if (!toSave.length) return;
    patch(brand.id, { saving: true });
    try {
      const res = await fetch("/api/events/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: toSave, brand_id: brand.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      patch(brand.id, { saving: false, saved: true });
    } catch (err) {
      patch(brand.id, { saving: false, error: String(err) });
    }
  }

  // 새 브랜드 추가
  async function addBrand() {
    if (!newName.trim() || !newSlug.trim()) { setAddError("브랜드명과 슬러그를 입력해주세요."); return; }
    setAddLoading(true); setAddError("");
    const { data, error } = await supabase
      .from("supplement_brands")
      .insert({ name: newName.trim(), slug: newSlug.trim(), events_url: newUrl.trim() || null })
      .select("*")
      .single();
    if (error) { setAddError(error.message); setAddLoading(false); return; }
    const brand = data as SupplementBrand;
    setBrands((prev) => [...prev, brand]);
    setStates((prev) => ({ ...prev, [brand.id]: defaultState(brand) }));
    setNewName(""); setNewSlug(""); setNewUrl("");
    setAddLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">크롤링 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">
          브랜드별 이벤트 URL을 설정하고 크롤링을 실행해요.
        </p>
      </div>

      {/* 새 브랜드 추가 */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          새 브랜드 추가
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="브랜드명 (예: 마이프로틴)"
            className="px-3 py-2 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s/g, "-"))}
            placeholder="슬러그 (예: myprotein)"
            className="px-3 py-2 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="이벤트 URL (선택)"
            className="px-3 py-2 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {addError && <p className="text-xs text-rose-500">{addError}</p>}
        <button
          onClick={addBrand}
          disabled={addLoading}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "추가"}
        </button>
      </div>

      {/* 브랜드 목록 */}
      <div className="space-y-3">
        {brands.map((brand) => {
          const s = states[brand.id];
          if (!s) return null;
          const selectedCount = s.selected.size;
          const hasResults = s.results !== null;

          return (
            <div key={brand.id} className="bg-white rounded-2xl border border-border overflow-hidden">
              {/* 브랜드 헤더 */}
              <div className="px-5 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{brand.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {brand.events_url ?? "URL 미설정"}
                  </p>
                </div>
                <button
                  onClick={() => patch(brand.id, { expanded: !s.expanded })}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {s.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* 확장 패널 */}
              {s.expanded && (
                <div className="border-t border-border px-5 py-4 space-y-4">
                  {/* URL 편집 */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> 이벤트 URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={s.editingUrl}
                        onChange={(e) => patch(brand.id, { editingUrl: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                      />
                      <button
                        onClick={() => saveUrl(brand)}
                        disabled={s.savingUrl || s.editingUrl === (brand.events_url ?? "")}
                        className="px-3 py-2 text-sm font-medium bg-muted rounded-xl hover:bg-muted/80 transition-colors disabled:opacity-40 shrink-0"
                      >
                        {s.savingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : "저장"}
                      </button>
                      <button
                        onClick={() => runCrawl(brand)}
                        disabled={s.loading || !s.editingUrl.trim()}
                        className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        {s.loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        크롤링
                      </button>
                    </div>
                  </div>

                  {/* 에러 */}
                  {s.error && (
                    <div className="flex items-center gap-2 text-sm text-rose-500 bg-rose-50 rounded-xl px-3 py-2.5">
                      <XCircle className="w-4 h-4 shrink-0" />
                      {s.error}
                    </div>
                  )}

                  {/* 크롤 결과 */}
                  {hasResults && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          {s.results!.length}개 발견 · {selectedCount}개 선택
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => patch(brand.id, { selected: new Set(s.results!.map((_, i) => i)) })}
                            className="text-xs text-primary hover:underline"
                          >전체선택</button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => patch(brand.id, { selected: new Set() })}
                            className="text-xs text-muted-foreground hover:underline"
                          >전체해제</button>
                        </div>
                      </div>

                      {s.results!.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          수집된 이벤트가 없어요. URL을 확인해주세요.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                          {s.results!.map((ev, i) => (
                            <label
                              key={i}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-colors",
                                s.selected.has(i)
                                  ? "bg-primary/5 border-primary/20"
                                  : "border-transparent hover:bg-muted/50"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={s.selected.has(i)}
                                onChange={() => {
                                  const next = new Set(s.selected);
                                  next.has(i) ? next.delete(i) : next.add(i);
                                  patch(brand.id, { selected: next });
                                }}
                                className="mt-0.5 accent-primary shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-snug">{ev.title}</p>
                                {ev.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ev.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  {ev.discount_rate && (
                                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                                      ▼{ev.discount_rate}%
                                    </span>
                                  )}
                                  {ev.end_date && (
                                    <span className="text-[10px] text-muted-foreground">~ {ev.end_date}</span>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      {s.results!.length > 0 && (
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            onClick={() => saveSelected(brand)}
                            disabled={s.saving || selectedCount === 0 || s.saved}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {s.saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {selectedCount}개 저장
                          </button>
                          {s.saved && (
                            <span className="flex items-center gap-1 text-sm text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                              저장 완료
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
