"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/client";

function PostHogIdentity() {
  useEffect(() => {
    const supabase = createClient();

    const identifyUser = (user: { id: string; email?: string; user_metadata: Record<string, unknown> }) => {
      const personProperties: Record<string, string> = {};
      if (user.email) personProperties.email = user.email;
      if (typeof user.user_metadata.full_name === "string") {
        personProperties.name = user.user_metadata.full_name;
      }

      posthog.identify(user.id, personProperties);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) identifyUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        posthog.reset();
      } else if (event === "SIGNED_IN" && session?.user) {
        identifyUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <PostHogIdentity />
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
