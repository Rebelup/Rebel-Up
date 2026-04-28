"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { getProfileById } from "@/lib/queries/users";

export function useCurrentUser() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        const p = await getProfileById(supabase, user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const p = await getProfileById(supabase, session.user.id);
        setProfile(p);
      } else {
        setUserId(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { profile, userId, loading };
}
