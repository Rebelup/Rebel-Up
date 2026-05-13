import { createClient } from "@/lib/supabase/server";
import { getTotalCounts } from "@/lib/queries/users";
import { getCategories } from "@/lib/queries/categories";
import { Users, FileText, Tag, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [counts, categories] = await Promise.all([
    getTotalCounts(supabase).catch(() => ({ users: 0, posts: 0 })),
    getCategories(supabase).catch(() => []),
  ]);

  const stats = [
    { label: "전체 회원", value: counts.users.toLocaleString(), icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "전체 게시글", value: counts.posts.toLocaleString(), icon: FileText, color: "text-green-500", bg: "bg-green-50" },
    { label: "카테고리", value: categories.length.toString(), icon: Tag, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "활성 카테고리", value: categories.filter((c) => c.is_active).length.toString(), icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground text-sm mt-1">Rebel-Up 커뮤니티 현황</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-border">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Link
          href="/admin/categories"
          className="bg-white rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="font-semibold group-hover:text-primary transition-colors">카테고리 관리</h2>
          </div>
          <p className="text-sm text-muted-foreground">게시판 카테고리를 추가, 수정, 순서 변경할 수 있어요.</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories.slice(0, 5).map((cat) => (
              <span key={cat.id} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {cat.label}
              </span>
            ))}
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="font-semibold group-hover:text-primary transition-colors">회원 관리</h2>
          </div>
          <p className="text-sm text-muted-foreground">회원 목록 조회, 권한 변경, 이용 제한 등을 관리할 수 있어요.</p>
          <p className="mt-4 text-2xl font-bold">{counts.users.toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">명</span></p>
        </Link>
      </div>
    </div>
  );
}
