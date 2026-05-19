import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PatientProfileInput } from '@shared/profile';
import { fetchProfile, upsertProfile } from '@/lib/profile';
import { useAuth } from '@/hooks/use-auth';

const profileKey = (uid: string | undefined) => ['profile', uid ?? 'anonymous'] as const;

export function useProfile() {
  const { user, status } = useAuth();
  const uid = user?.uid;

  const query = useQuery({
    queryKey: profileKey(uid),
    queryFn: () => {
      if (!uid) throw new Error('Cannot fetch profile while signed out.');
      return fetchProfile(uid);
    },
    enabled: status === 'signed-in' && Boolean(uid),
  });

  return query;
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
      void queryClient.invalidateQueries({ queryKey: profileKey(uid) });
    },
  });
}
