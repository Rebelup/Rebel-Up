export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  onboarding_complete: boolean;
  role: UserRole;
  banned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  label: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export type CategoryKey = string;

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  image_urls: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type RoutineType = "workout" | "diet";

export interface RoutineItem {
  id: string;
  routine_id: string;
  name: string;
  detail: string | null;
  order_index: number;
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  title: string;
  type: RoutineType;
  days: number[]; // 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일
  order_index: number;
  created_at: string;
  updated_at: string;
  routine_items?: RoutineItem[];
}

export interface RoutineLog {
  id: string;
  user_id: string;
  routine_id: string;
  log_date: string;
  created_at: string;
}
