export const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "workout", label: "운동" },
  { key: "diet", label: "식단" },
  { key: "supplements", label: "보충제" },
  { key: "body_profile", label: "바디프로필" },
  { key: "free", label: "자유" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export const PAGE_SIZE = 12;

export const CATEGORY_COLORS: Record<string, string> = {
  workout: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  diet: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  supplements: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  body_profile: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label])
);
