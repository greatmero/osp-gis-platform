import { useQuery } from '@tanstack/react-query';
import { api, Incident } from '../api/client';

interface IncidentsParams {
  status?: string;
  severity?: string;
}

export function useIncidents(params: IncidentsParams = {}) {
  return useQuery<Incident[]>({
    queryKey: ['incidents', params],
    queryFn: () => {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.severity) q.set('severity', params.severity);
      return api.get<Incident[]>(`/incidents?${q.toString()}`);
    },
    staleTime: 30_000,
  });
}
