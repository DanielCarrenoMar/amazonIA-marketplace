import { apiFetch } from './client';

export interface ImpactStats {
  artisansCount: number;
  transactionsCount: number;
  totalVolume: number;
  activeProducts: number;
}

export async function getImpactStats(): Promise<ImpactStats | null> {
  try {
    return await apiFetch<ImpactStats>('/v1/stats/impact');
  } catch (error) {
    console.error("Failed to fetch impact stats", error);
    return null;
  }
}
