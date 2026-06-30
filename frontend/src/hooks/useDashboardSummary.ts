import { useQuery } from '@tanstack/react-query';
import { api, DashboardSummary } from '../api/client';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const BASE_URL = import.meta.env.BASE_URL;

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: DEMO
      ? () => fetch(`${BASE_URL}data/dashboard.json`).then((r) => r.json())
      : () => api.get<DashboardSummary>('/dashboard/summary'),
    staleTime: 30_000,
    refetchInterval: DEMO ? false : 60_000,
  });
}
