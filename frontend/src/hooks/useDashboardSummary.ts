import { useQuery } from '@tanstack/react-query';
import { api, DashboardSummary } from '../api/client';

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
