import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DiabeteSymptomReportInput, StoredDiabeteSymptomReport } from '@shared/symptoms';
import { addDiabeteSymptomReport, listDiabeteSymptomReports } from '@/lib/symptoms';
import { useAuth } from '@/hooks/use-auth';

const reportsKey = (uid: string | undefined) =>
  ['symptom-reports', 'diabete', uid ?? 'anonymous'] as const;

export function useDiabeteSymptomReports(options: { max?: number } = {}) {
  const { user, status } = useAuth();
  const uid = user?.uid;
  return useQuery<StoredDiabeteSymptomReport[]>({
    queryKey: [...reportsKey(uid), options.max ?? 50],
    queryFn: () => {
      if (!uid) throw new Error('Cannot list symptom reports while signed out.');
      return listDiabeteSymptomReports(uid, options);
    },
    enabled: status === 'signed-in' && Boolean(uid),
  });
}

export function useAddDiabeteSymptomReport() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DiabeteSymptomReportInput) => {
      if (!uid) throw new Error('Cannot save symptom report while signed out.');
      await addDiabeteSymptomReport(uid, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportsKey(uid) });
    },
  });
}
