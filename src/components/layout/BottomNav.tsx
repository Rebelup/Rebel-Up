"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users2, User } from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useCurrentUser();
  const profileHref = profile ? `/profile/${profile.username}` : "/profile";

  const items = [
    { href: "/routine", label: "루틴", icon: CalendarDays, match: (p: string) => p.startsWith("/routine") },
    { href: "/feed", label: "커뮤니티", icon: Users2, match: (p: string) => p.startsWith("/feed") || p.startsWith("/post") },
    { href: profileHref, label: "내정보", icon: User, match: (p: string) => p.startsWith("/profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border safe-area-pb">
      <div className="max-w-lg mx-auto">
        <div className="flex items-stretch">
          {items.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-[22px] h-[22px]", active && "stroke-[2.5]")} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
