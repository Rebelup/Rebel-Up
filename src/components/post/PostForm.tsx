"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { createPost } from "@/lib/queries/posts";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "./ImageUploader";
import { toast } from "sonner";

export function PostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [supabase] = useState(() => createClient());

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("workout");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const imageUrls: string[] = [];

      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("post-images").upload(path, file);
        if (!error) {
          const { data } = supabase.storage.from("post-images").getPublicUrl(path);
          imageUrls.push(data.publicUrl);
        }
      }

      const post = await createPost(supabase, {
        title: title.trim(),
        content: content.trim(),
        category,
        image_urls: imageUrls,
        author_id: userId,
      });

      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("게시글이 등록됐어요!");
      router.push(`/post/${post.id}`);
    } catch {
      toast.error("게시글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label>카테고리</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.key !== "all").map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          maxLength={100}
          required
        />
        <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">내용 *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
          maxLength={5000}
          rows={8}
          required
        />
        <p className="text-xs text-muted-foreground text-right">{content.length}/5000</p>
      </div>

      <div className="space-y-1.5">
        <Label>사진 <span className="text-muted-foreground">(선택)</span></Label>
        <ImageUploader
          images={images}
          previews={previews}
          onChange={(imgs, prevs) => {
            setImages(imgs);
            setPreviews(prevs);
          }}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={submitting}
        >
          취소
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting || !title || !content}>
          {submitting ? "등록 중..." : "게시하기"}
        </Button>
      </div>
    </form>
  );
}
