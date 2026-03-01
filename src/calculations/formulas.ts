
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
  if (score >= 80) return 'Alto Contribuidor';
  if (score >= 70) return 'Parcial';
  if (score >= 60) return 'Oscilante';
  return 'Risco';
}
