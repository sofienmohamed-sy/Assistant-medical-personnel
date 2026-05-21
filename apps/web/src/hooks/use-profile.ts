import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PathologiesFormInput, PatientProfileInput } from '@shared/index';
import { fetchUserDoc, upsertPathologies, upsertProfile, type UserDoc } from '@/lib/profile';
import { useAuth } from '@/hooks/use-auth';

const userDocKey = (uid: string | undefined) => ['user-doc', uid ?? 'anonymous'] as const;

export function useUserDoc() {
  const { user, status } = useAuth();
  const uid = user?.uid;

  return useQuery<UserDoc>({
    queryKey: userDocKey(uid),
    queryFn: () => {
      if (!uid) throw new Error('Cannot fetch user doc while signed out.');
      return fetchUserDoc(uid);
    },
    enabled: status === 'signed-in' && Boolean(uid),
  });
}

// Backwards-compatible alias for code that only needs the profile half.
export function useProfile() {
  const query = useUserDoc();
  return {
    ...query,
    data: query.data?.profile ?? null,
  } as const;
}

export function useUpsertProfile() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PatientProfileInput) => {
      if (!uid) throw new Error('Cannot save profile while signed out.');
      await upsertProfile(uid, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userDocKey(uid) });
    },
  });
}

export function useUpsertPathologies() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PathologiesFormInput) => {
      if (!uid) throw new Error('Cannot save pathologies while signed out.');
      await upsertPathologies(uid, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userDocKey(uid) });
    },
  });
}
