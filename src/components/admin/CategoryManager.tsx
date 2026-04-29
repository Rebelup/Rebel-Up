"use client";

import { useState } from "react";
import { Category } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { createCategory, updateCategory, deleteCategory } from "@/lib/queries/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const COLOR_OPTIONS = [
  { key: "blue", label: "파랑", class: "bg-blue-500" },
  { key: "green", label: "초록", class: "bg-green-500" },
  { key: "purple", label: "보라", class: "bg-purple-500" },
  { key: "pink", label: "분홍", class: "bg-pink-500" },
  { key: "orange", label: "주황", class: "bg-orange-500" },
  { key: "red", label: "빨강", class: "bg-red-500" },
  { key: "yellow", label: "노랑", class: "bg-yellow-500" },
  { key: "gray", label: "회색", class: "bg-gray-400" },
];

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [supabase] = useState(() => createClient());
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState({ label: "", slug: "", color: "blue" });
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ label: "", slug: "", color: "blue" });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setForm({ label: cat.label, slug: cat.slug, color: cat.color });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.slug.trim()) return;
    setSubmitting(true);

    try {
      if (editTarget) {
        await updateCategory(supabase, editTarget.id, {
          label: form.label.trim(),
          slug: form.slug.trim().toLowerCase().replace(/\s+/g, "_"),
          color: form.color,
        });
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editTarget.id
              ? { ...c, label: form.label.trim(), slug: form.slug.trim(), color: form.color }
              : c
          )
        );
        toast.success("카테고리가 수정됐어요.");
      } else {
        const maxOrder = categories.reduce((m, c) => Math.max(m, c.display_order), 0);
        const created = await createCategory(supabase, {
          label: form.label.trim(),
          slug: form.slug.trim().toLowerCase().replace(/\s+/g, "_"),
          color: form.color,
          display_order: maxOrder + 1,
        });
        setCategories((prev) => [...prev, created]);
        toast.success("카테고리가 추가됐어요.");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "다시 시도해주세요.";
      toast.error(`오류: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await updateCategory(supabase, cat.id, { is_active: !cat.is_active });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch {
      toast.error("변경에 실패했습니다.");
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`"${cat.label}" 카테고리를 삭제할까요?\n기존 게시글의 카테고리 표시에 영향을 줄 수 있습니다.`)) return;
    try {
      await deleteCategory(supabase, cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success("카테고리가 삭제됐어요.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const moveOrder = async (cat: Category, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swapCat = sorted[swapIdx];
    const [newOrder, swapOrder] = [swapCat.display_order, cat.display_order];

    try {
      await Promise.all([
        updateCategory(supabase, cat.id, { display_order: newOrder }),
        updateCategory(supabase, swapCat.id, { display_order: swapOrder }),
      ]);
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id === cat.id) return { ...c, display_order: newOrder };
          if (c.id === swapCat.id) return { ...c, display_order: swapOrder };
          return c;
        })
      );
    } catch {
      toast.error("순서 변경에 실패했습니다.");
    }
  };

  const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);

  const colorClass = (key: string) =>
    COLOR_OPTIONS.find((c) => c.key === key)?.class ?? "bg-gray-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">카테고리 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">게시판 카테고리를 자유롭게 설정하세요.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              카테고리 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editTarget ? "카테고리 수정" : "카테고리 추가"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>이름 (한국어)</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="예: 헬스, 크로스핏"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>슬러그 (영문)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "_") }))
                  }
                  placeholder="예: crossfit"
                  required
                />
                <p className="text-xs text-muted-foreground">게시글 저장에 사용되는 영문 키입니다.</p>
              </div>
              <div className="space-y-1.5">
                <Label>색상</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: opt.key }))}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform",
                        opt.class,
                        form.color === opt.key && "ring-2 ring-offset-2 ring-foreground scale-110"
                      )}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "저장 중..." : editTarget ? "수정하기" : "추가하기"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">카테고리가 없어요.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8">순서</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">카테고리</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">슬러그</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((cat, idx) => (
                <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveOrder(cat, "up")}
                        disabled={idx === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveOrder(cat, "down")}
                        disabled={idx === sorted.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-3 h-3 rounded-full shrink-0", colorClass(cat.color))} />
                      <span className="font-medium">{cat.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cat.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(cat)}
                      className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors",
                        cat.is_active
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {cat.is_active ? (
                        <><Eye className="w-3 h-3" />공개</>
                      ) : (
                        <><EyeOff className="w-3 h-3" />숨김</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} className="h-8 w-8">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cat)}
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
  );
}
