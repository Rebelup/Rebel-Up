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
