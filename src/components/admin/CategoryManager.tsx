"use client";

import { useState } from "react";
import { EventCategory } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initialCategories: EventCategory[];
}

interface FormState {
  name: string;
  slug: string;
  parent_id: string | null;
}

const EMPTY_FORM: FormState = { name: "", slug: "", parent_id: null };

async function apiFetch(path: string, method: string, body?: object) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "요청 실패");
  return data;
}

export function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<EventCategory[]>(initialCategories);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<EventCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const parents = categories.filter((c) => !c.parent_id).sort((a, b) => a.display_order - b.display_order);
  const childrenOf = (id: string) =>
    categories.filter((c) => c.parent_id === id).sort((a, b) => a.display_order - b.display_order);

  const openAdd = (parentId: string | null = null) => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, parent_id: parentId });
    setShowForm(true);
  };

  const openEdit = (cat: EventCategory) => {
    setEditTarget(cat);
    setForm({ name: cat.name, slug: cat.slug, parent_id: cat.parent_id });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    setSubmitting(true);
    try {
      if (editTarget) {
        const updated = await apiFetch(`/api/admin/event-categories/${editTarget.id}`, "PATCH", {
          name: form.name.trim(),
          slug: form.slug.trim(),
          parent_id: form.parent_id,
        });
        setCategories((prev) => prev.map((c) => c.id === editTarget.id ? { ...c, ...updated } : c));
        toast.success("수정됐어요.");
      } else {
        const siblings = categories.filter((c) => c.parent_id === form.parent_id);
        const maxOrder = siblings.reduce((m, c) => Math.max(m, c.display_order), 0);
        const created = await apiFetch("/api/admin/event-categories", "POST", {
          name: form.name.trim(),
          slug: form.slug.trim(),
          parent_id: form.parent_id,
          display_order: maxOrder + 1,
        });
        setCategories((prev) => [...prev, created]);
        toast.success("추가됐어요.");
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: EventCategory) => {
    const hasChildren = categories.some((c) => c.parent_id === cat.id);
    const msg = hasChildren
      ? `"${cat.name}" 삭제 시 하위 카테고리도 모두 삭제됩니다. 계속할까요?`
      : `"${cat.name}"을(를) 삭제할까요?`;
    if (!confirm(msg)) return;
    try {
      await apiFetch(`/api/admin/event-categories/${cat.id}`, "DELETE");
      setCategories((prev) => prev.filter((c) => c.id !== cat.id && c.parent_id !== cat.id));
      toast.success("삭제됐어요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 실패");
    }
  };

  const moveOrder = async (cat: EventCategory, dir: "up" | "down") => {
    const siblings = categories
      .filter((c) => c.parent_id === cat.parent_id)
      .sort((a, b) => a.display_order - b.display_order);
    const idx = siblings.findIndex((c) => c.id === cat.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const swap = siblings[swapIdx];
    try {
      await Promise.all([
        apiFetch(`/api/admin/event-categories/${cat.id}`, "PATCH", { display_order: swap.display_order }),
        apiFetch(`/api/admin/event-categories/${swap.id}`, "PATCH", { display_order: cat.display_order }),
      ]);
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id === cat.id) return { ...c, display_order: swap.display_order };
          if (c.id === swap.id) return { ...c, display_order: cat.display_order };
          return c;
        })
      );
    } catch { toast.error("순서 변경 실패"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">카테고리 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">이벤트 페이지에 표시될 1차·2차 카테고리를 설정하세요.</p>
        </div>
        <button
          onClick={() => openAdd(null)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          1차 카테고리 추가
        </button>
      </div>

      {/* 인라인 폼 */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-primary/30 p-5 shadow-sm">
          <p className="text-sm font-semibold mb-4">
            {editTarget ? "카테고리 수정" : form.parent_id ? "2차 카테고리 추가" : "1차 카테고리 추가"}
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!editTarget && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">상위 카테고리</label>
                <select
                  value={form.parent_id ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value || null }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">없음 (1차 카테고리)</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">이름</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-가-힣]/g, "") }))}
                  placeholder="예: 단백질"
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">슬러그 (영문)</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                  placeholder="예: protein"
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "저장 중..." : editTarget ? "수정" : "추가"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 카테고리 트리 */}
      {parents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border py-16 text-center text-sm text-muted-foreground">
          아직 카테고리가 없어요. 1차 카테고리를 추가해보세요.
        </div>
      ) : (
        <div className="space-y-3">
          {parents.map((parent, pIdx) => {
            const children = childrenOf(parent.id);
            return (
              <div key={parent.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                {/* 1차 카테고리 행 */}
                <div className="flex items-center gap-3 px-4 py-3.5 bg-muted/30">
                  <div className="flex flex-col gap-0 shrink-0">
                    <button onClick={() => moveOrder(parent, "up")} disabled={pIdx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-[10px] leading-none">▲</button>
                    <button onClick={() => moveOrder(parent, "down")} disabled={pIdx === parents.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-[10px] leading-none">▼</button>
                  </div>
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  <span className="font-semibold text-sm flex-1">{parent.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{parent.slug}</span>
                  <span className="text-xs text-muted-foreground">{children.length}개 하위</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openAdd(parent.id)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title="2차 카테고리 추가"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(parent)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(parent)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2차 카테고리 행들 */}
                {children.map((child, cIdx) => (
                  <div key={child.id} className="flex items-center gap-3 px-4 py-3 border-t border-border/50 hover:bg-muted/10">
                    <div className="w-4 shrink-0" />
                    <div className="flex flex-col gap-0 shrink-0">
                      <button onClick={() => moveOrder(child, "up")} disabled={cIdx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-[10px] leading-none">▲</button>
                      <button onClick={() => moveOrder(child, "down")} disabled={cIdx === children.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-[10px] leading-none">▼</button>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                    <span className={cn("text-sm flex-1", !child.is_active && "text-muted-foreground line-through")}>{child.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{child.slug}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(child)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(child)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {children.length === 0 && (
                  <div className="px-4 py-3 border-t border-border/50 text-xs text-muted-foreground italic">
                    하위 카테고리 없음 —{" "}
                    <button onClick={() => openAdd(parent.id)} className="text-primary underline">추가하기</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
