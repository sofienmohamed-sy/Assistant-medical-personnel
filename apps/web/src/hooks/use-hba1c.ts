import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HbA1cMeasurementInput, StoredHbA1cMeasurement } from '@shared/measurements';
import { addHbA1cMeasurement, listHbA1cMeasurements } from '@/lib/hba1c';
import { useAuth } from '@/hooks/use-auth';

const listKey = (uid: string | undefined) => ['measurements', 'hba1c', uid ?? 'anonymous'] as const;

export function useHbA1cMeasurements(options: { max?: number } = {}) {
  const { user, status } = useAuth();
  const uid = user?.uid;
  return useQuery<StoredHbA1cMeasurement[]>({
    queryKey: [...listKey(uid), options.max ?? 30],
    queryFn: () => {
      if (!uid) throw new Error('Cannot list HbA1c measurements while signed out.');
      return listHbA1cMeasurements(uid, options);
    },
    enabled: status === 'signed-in' && Boolean(uid),
  });
}

export function useAddHbA1cMeasurement() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: HbA1cMeasurementInput) => {
      if (!uid) throw new Error('Cannot save HbA1c measurement while signed out.');
      await addHbA1cMeasurement(uid, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listKey(uid) });
    },
  });
}
