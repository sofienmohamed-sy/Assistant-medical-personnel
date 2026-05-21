import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DiabeteEmergencyPlanInput, StoredDiabeteEmergencyPlan } from '@shared/emergency-plan';
import { fetchDiabeteEmergencyPlan, upsertDiabeteEmergencyPlan } from '@/lib/emergency-plan';
import { useAuth } from '@/hooks/use-auth';

const planKey = (uid: string | undefined) =>
  ['emergency-plan', 'diabete', uid ?? 'anonymous'] as const;

export function useDiabeteEmergencyPlan() {
  const { user, status } = useAuth();
  const uid = user?.uid;
  return useQuery<StoredDiabeteEmergencyPlan | null>({
    queryKey: planKey(uid),
    queryFn: () => {
      if (!uid) throw new Error('Cannot fetch emergency plan while signed out.');
      return fetchDiabeteEmergencyPlan(uid);
    },
    enabled: status === 'signed-in' && Boolean(uid),
  });
}

export function useUpsertDiabeteEmergencyPlan() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DiabeteEmergencyPlanInput) => {
      if (!uid) throw new Error('Cannot save emergency plan while signed out.');
      await upsertDiabeteEmergencyPlan(uid, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planKey(uid) });
    },
  });
}
