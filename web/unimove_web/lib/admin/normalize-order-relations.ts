export function normaliseJoin<T>(raw: unknown): T | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw[0] as T) ?? null;
  return raw as T;
}

type JoinedProfile = {
  id?: string;
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
};

type ProviderJoin = {
  business_name?: string | null;
  profiles?: JoinedProfile | JoinedProfile[] | null;
};

export function getProviderDisplayName(provider: unknown): string | null {
  const providerRaw = normaliseJoin<ProviderJoin>(provider);
  if (!providerRaw) return null;

  const profile = providerRaw.profiles
    ? normaliseJoin<JoinedProfile>(providerRaw.profiles)
    : null;

  return providerRaw.business_name ?? profile?.full_name ?? null;
}

export function getCustomerDisplayName(customer: unknown): string | null {
  const profile = normaliseJoin<JoinedProfile>(customer);
  return profile?.full_name ?? null;
}

export function flattenOrderProvider(provider: unknown) {
  const providerRaw = normaliseJoin<ProviderJoin & JoinedProfile>(provider);
  if (!providerRaw) return null;

  const profile = providerRaw.profiles
    ? normaliseJoin<JoinedProfile>(providerRaw.profiles)
    : providerRaw;

  return {
    id: profile?.id,
    full_name: profile?.full_name ?? providerRaw.full_name ?? "—",
    business_name: providerRaw.business_name ?? null,
    phone: profile?.phone ?? null,
    avatar_url: profile?.avatar_url ?? null,
  };
}
