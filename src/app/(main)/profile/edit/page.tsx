"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, getProfileById, checkUsernameAvailable } from "@/lib/queries/users";
import { Profile } from "@/lib/types";
import { Camera, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function EditProfilePage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const p = await getProfileById(supabase, user.id);
        if (p) {
          setProfile(p);
          setDisplayName(p.display_name);
          setUsername(p.username);
          setBio(p.bio ?? "");
          setWebsite(p.website ?? "");
          setAvatarUrl(p.avatar_url);
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkUsername = useCallback(
    async (value: string) => {
      if (!profile || value === profile.username) {
        setUsernameAvailable(null);
        return;
      }
      if (!value || value.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      const available = await checkUsernameAvailable(supabase, value, profile.id);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    },
    [supabase, profile]
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
    if (!profile || !username || !displayName) return;
    if (usernameAvailable === false) return;

    setSubmitting(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${profile.id}/avatar.${ext}`;
        const { error } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });

        if (!error) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          finalAvatarUrl = data.publicUrl;
        }
      }

      await updateProfile(supabase, profile.id, {
        username,
        display_name: displayName,
        bio: bio || null,
        website: website || null,
        avatar_url: finalAvatarUrl,
      });

      toast.success("프로필이 업데이트됐어요!");
      router.push(`/profile/${username}`);
    } catch {
      toast.error("프로필 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 flex justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/profile/${profile.username}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">프로필 편집</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center">
          <label className="relative cursor-pointer group">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg">{displayName.slice(0, 2)}</AvatarFallback>
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
          <Label htmlFor="bio">소개</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">웹사이트</Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            취소
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={submitting || usernameAvailable === false}
          >
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}
