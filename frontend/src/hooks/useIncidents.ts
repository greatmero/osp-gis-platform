import { useQuery } from '@tanstack/react-query';
import { api, Incident } from '../api/client';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const BASE_URL = import.meta.env.BASE_URL;

interface IncidentsParams {
  status?: string;
  severity?: string;
}

export function useIncidents(params: IncidentsParams = {}) {
  return useQuery<Incident[]>({
    queryKey: ['incidents', params],
    queryFn: async () => {
      if (DEMO) {
        const all = await fetch(`${BASE_URL}data/incidents.json`).then((r) => r.json()) as Incident[];
        return all
          .filter((i) => !params.status || i.status === params.status)
          .filter((i) => !params.severity || i.severity === params.severity);
      }
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.severity) q.set('severity', params.severity);
      return api.get<Incident[]>(`/incidents?${q.toString()}`);
    },
    staleTime: 30_000,
  });
}
