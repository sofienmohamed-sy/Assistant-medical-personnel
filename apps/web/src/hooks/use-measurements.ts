import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GlycemiaMeasurementInput, StoredMeasurement } from '@shared/measurements';
import { addGlycemiaMeasurement, listGlycemiaMeasurements } from '@/lib/measurements';
import { useAuth } from '@/hooks/use-auth';

const glycemiaListKey = (uid: string | undefined) =>
  ['measurements', 'glycemia', uid ?? 'anonymous'] as const;

export function useGlycemiaMeasurements(options: { max?: number } = {}) {
  const { user, status } = useAuth();
  const uid = user?.uid;
  return useQuery<StoredMeasurement[]>({
    queryKey: [...glycemiaListKey(uid), options.max ?? 50],
    queryFn: () => {
      if (!uid) throw new Error('Cannot list measurements while signed out.');
      return listGlycemiaMeasurements(uid, options);
    },
    enabled: status === 'signed-in' && Boolean(uid),
  });
}

export function useAddGlycemiaMeasurement() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GlycemiaMeasurementInput) => {
      if (!uid) throw new Error('Cannot save measurement while signed out.');
      await addGlycemiaMeasurement(uid, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: glycemiaListKey(uid) });
    },
  });
}
