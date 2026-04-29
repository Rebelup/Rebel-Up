"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  categories: Category[];
}

export function CategoryTabs({ categories }: CategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "all";

  const handleSelect = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") {
      params.delete("category");
    } else {
      params.set("category", key);
    }
    router.replace(`/feed?${params.toString()}`);
  };

  return (
    <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-0.5 overflow-x-auto no-scrollbar py-2.5">
          <button
            onClick={() => handleSelect("all")}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              active === "all"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleSelect(cat.slug)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                active === cat.slug
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
