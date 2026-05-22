const emptyConfig = {
  configured: false,
  url: "",
  publishableKey: "",
  reason: "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.",
};

export function getSupabaseConfig(env = import.meta.env) {
  const source = env ?? {};
  const url = source.VITE_SUPABASE_URL?.trim() ?? "";
  const publishableKey = (
    source.VITE_SUPABASE_PUBLISHABLE_KEY ??
    source.VITE_SUPABASE_ANON_KEY ??
    ""
  ).trim();

  if (!url || !publishableKey) {
    return {
      ...emptyConfig,
      reason: !url
        ? "Missing VITE_SUPABASE_URL."
        : "Missing VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.",
    };
  }

  return {
    configured: true,
    url,
    publishableKey,
    reason: "",
  };
}
