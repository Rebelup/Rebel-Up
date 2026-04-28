"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, checkUsernameAvailable } from "@/lib/queries/users";
import { Dumbbell, Camera, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  // createClient() called inside effects to avoid SSR env-var issues
  const [supabase] = useState(() => createClient());

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setDisplayName(user.user_metadata?.full_name ?? "");
        setAvatarUrl(user.user_metadata?.avatar_url ?? null);
        const emailPrefix = user.email?.split("@")[0] ?? "";
        setUsername(emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkUsername = useCallback(
    async (value: string) => {
      if (!value || value.length < 3 || !userId) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      const available = await checkUsernameAvailable(supabase, value, userId);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    },
    [supabase, userId]
  );

  useEffect(() => {
    const timer = setTimeout(() => checkUsername(username), 400);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !username || !displayName) return;
    if (usernameAvailable === false) return;

    setSubmitting(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${userId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          finalAvatarUrl = data.publicUrl;
        }
      }

      await updateProfile(supabase, userId, {
        username,
        display_name: displayName,
        bio: bio || null,
        avatar_url: finalAvatarUrl,
        onboarding_complete: true,
      });

      router.push("/feed");
    } catch {
      toast.error("프로필 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = displayName?.slice(0, 2) ?? "RU";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">프로필 설정</h1>
          <p className="text-sm text-muted-foreground">Rebel-Up에 오신 걸 환영해요! 프로필을 완성해주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="displayName">이름 *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="표시될 이름"
              maxLength={30}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">아이디 *</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="영문 소문자, 숫자, _만 사용"
                maxLength={30}
                minLength={3}
                required
                className="pr-8"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {checkingUsername && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <X className="w-4 h-4 text-destructive" />
                )}
              </div>
            </div>
            {usernameAvailable === false && (
              <p className="text-xs text-destructive">이미 사용 중인 아이디예요.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">소개 <span className="text-muted-foreground">(선택)</span></Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="나를 간단히 소개해주세요"
              maxLength={150}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={
              submitting ||
              !username ||
              !displayName ||
              usernameAvailable === false ||
              username.length < 3
            }
          >
            {submitting ? "저장 중..." : "시작하기"}
          </Button>
        </form>
      </div>
    </div>
  );
}
