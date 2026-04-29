"use client";

import { useState } from "react";
import { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { getAllUsers, setUserRole, banUser, unbanUser } from "@/lib/queries/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, ShieldCheck, ShieldOff, Ban, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface UserManagerProps {
  initialUsers: Profile[];
  currentUserId: string;
}

export function UserManager({ initialUsers, currentUserId }: UserManagerProps) {
  const [supabase] = useState(() => createClient());
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const results = await getAllUsers(supabase, { search: search.trim() });
      setUsers(results);
    } catch {
      toast.error("검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  };

  const handleRoleToggle = async (user: Profile) => {
    if (user.id === currentUserId) return toast.error("자신의 권한은 변경할 수 없어요.");
    setPending(user.id);
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await setUserRole(supabase, user.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      toast.success(`${user.display_name}님을 ${newRole === "admin" ? "관리자" : "일반 회원"}으로 변경했어요.`);
    } catch {
      toast.error("권한 변경에 실패했습니다.");
    } finally {
      setPending(null);
    }
  };

  const handleBanToggle = async (user: Profile) => {
    if (user.id === currentUserId) return toast.error("자신을 제한할 수 없어요.");
    setPending(user.id);
    try {
      if (user.banned_at) {
        await unbanUser(supabase, user.id);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, banned_at: null } : u)));
        toast.success(`${user.display_name}님의 이용 제한이 해제됐어요.`);
      } else {
        await banUser(supabase, user.id);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, banned_at: new Date().toISOString() } : u))
        );
        toast.success(`${user.display_name}님을 이용 제한했어요.`);
      }
    } catch {
      toast.error("변경에 실패했습니다.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">전체 {users.length}명</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 아이디로 검색"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={searching} variant="outline">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
        </Button>
      </form>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">회원이 없어요.</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  user.banned_at && "bg-red-50/50"
                )}
              >
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{user.display_name.slice(0, 2)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm">{user.display_name}</span>
                    {user.role === "admin" && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                        관리자
                      </span>
                    )}
                    {user.banned_at && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                        이용제한
                      </span>
                    )}
                    {user.id === currentUserId && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">나</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    @{user.username} · {formatRelativeTime(user.created_at)} 가입
                  </p>
                </div>

                {user.id !== currentUserId && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRoleToggle(user)}
                      disabled={pending === user.id}
                      className="h-8 text-xs gap-1"
                    >
                      {pending === user.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : user.role === "admin" ? (
                        <><ShieldOff className="w-3.5 h-3.5" />권한 해제</>
                      ) : (
                        <><ShieldCheck className="w-3.5 h-3.5" />관리자</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBanToggle(user)}
                      disabled={pending === user.id}
                      className={cn(
                        "h-8 text-xs gap-1",
                        user.banned_at
                          ? "text-green-600 hover:text-green-700"
                          : "text-destructive hover:text-destructive"
                      )}
                    >
                      {user.banned_at ? (
                        <><CheckCircle className="w-3.5 h-3.5" />제한 해제</>
                      ) : (
                        <><Ban className="w-3.5 h-3.5" />이용 제한</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
