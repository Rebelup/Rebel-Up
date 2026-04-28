"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CategoryTabs() {
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
    <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleSelect(cat.key)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                active === cat.key
                  ? "bg-primary text-primary-foreground"
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
