"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  images: File[];
  previews: string[];
  onChange: (images: File[], previews: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, previews, onChange, maxImages = 5 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = maxImages - images.length;
    const newFiles = files.slice(0, remaining);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    onChange([...images, ...newFiles], [...previews, ...newPreviews]);
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    onChange(newImages, newPreviews);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
            <Image src={src} alt={`이미지 ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-xs">사진 추가</span>
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        최대 {maxImages}장 · {images.length}/{maxImages}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleAdd}
      />
    </div>
  );
}
