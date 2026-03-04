
import { PillarBase } from '../types/oracle';

export const WEIGHTS = {
  mercantil: 0.4,
  cdc: 0.3,
  services: 0.3,
};

export function calculateICM(realized: number, meta: number): number {
  if (meta <= 0) return 0;
  return (realized / meta) * 100;
}

export function calculateGap(meta: number, realized: number): number {
  return meta - realized;
}

export function calculateHealthIndex(mercantilIC: number, cdcIC: number, servicesIC: number): number {
  return Math.round((mercantilIC * WEIGHTS.mercantil) + (cdcIC * WEIGHTS.cdc) + (servicesIC * WEIGHTS.services));
}

export function classifyHealth(index: number): string {
  if (index >= 90) return 'Alta Performance Sustentável';
  if (index >= 80) return 'Performance Competitiva';
  if (index >= 70) return 'Zona de Atenção';
  if (index >= 60) return 'Pressão Estrutural';
  return 'Risco Crítico';
}

export function classifySeller(score: number): string {
  if (score >= 90) return 'Elite';
  if (score >= 80) return 'Alto';
  if (score >= 70) return 'Parcial';
  return 'Risco';
}

export function calculateBalanceIndex(icms: number[]): number {
  const validIcms = icms.filter(v => v > 0);
  if (validIcms.length < 2) return 1; // Default to balanced if not enough data
  const min = Math.min(...validIcms);
  const max = Math.max(...validIcms);
  return max > 0 ? min / max : 1;
}

export function classifySellerProfile(score: number, balanceIndex: number, icms: number[]): string {
  if (score >= 100) {
    return balanceIndex >= 0.6 ? 'DOMINANTE EQUILIBRADO' : 'DOMINANTE DESBALANCEADO';
  }
  
  if (score >= 50 && score < 100) {
    const hasPillarBelow40 = icms.some(v => v < 40);
    if (hasPillarBelow40) return 'VOLUME FRÁGIL';
    return 'ESTÁVEL'; // Fallback for 50-99 without pillar < 40
  }
  
  if (score < 50) return 'BAIXA TRAÇÃO';
  
  return 'EM DESENVOLVIMENTO';
}
