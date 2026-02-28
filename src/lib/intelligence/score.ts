
import { Seller, Store } from '../../types/oracle';

export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const calcICM = (real: number, meta: number) => (real / Math.max(meta, 1)) * 100;

export const calcPillarNote = (real: number, meta: number) => {
  const icm = calcICM(real, meta);
  const icmClamp = clamp(icm, 0, 200);
  return Math.min(100, icmClamp);
};

export const calcScoreBase = (notaMerc: number, notaCDC: number, notaServ: number) => {
  return (0.4 * notaMerc) + (0.3 * notaCDC) + (0.3 * notaServ);
};

export const calcSpreadPenalty = (notaMerc: number, notaCDC: number, notaServ: number) => {
  const max = Math.max(notaMerc, notaCDC, notaServ);
  const min = Math.min(notaMerc, notaCDC, notaServ);
  const spread = max - min;
  return Math.min(15, spread * 0.25);
};

export const calcDependencyPenalty = (top1MercReal: number, top2MercReal: number, totalMercReal: number) => {
  const top2Share = (top1MercReal + top2MercReal) / Math.max(totalMercReal, 1);
  let penDep = 0;
  if (top2Share <= 0.50) {
    penDep = 0;
  } else if (top2Share <= 0.60) {
    penDep = (top2Share - 0.50) * 100 * 1.0;
  } else {
    penDep = 10 + (top2Share - 0.60) * 100 * 2.0;
  }
  return clamp(penDep, 0, 20);
};

export const calcZerosPenaltySeller = (mercantil: number, cdc: number, services: number) => {
  const zeros = [mercantil, cdc, services].filter(v => v === 0).length;
  if (zeros === 0) return 0;
  if (zeros === 1) return 8;
  if (zeros === 2) return 18;
  return 30;
};

export const calcTeamZeroPenalty = (sellers: Seller[]) => {
  if (sellers.length === 0) return 0;
  const total = sellers.length;
  const zeroMerc = sellers.filter(s => s.pillars.mercantil.realized === 0).length / total;
  const zeroCDC = sellers.filter(s => s.pillars.cdc.realized === 0).length / total;
  const zeroServ = sellers.filter(s => s.pillars.services.realized === 0).length / total;

  const maxPct = Math.max(zeroMerc, zeroCDC, zeroServ);
  if (maxPct > 0.50) return 18;
  if (maxPct > 0.30) return 10;
  return 0;
};

export const calcPeriodScoreStore = (store: Store, sellers: Seller[]) => {
  const notaMerc = calcPillarNote(store.pillars.mercantil.realized, store.pillars.mercantil.meta);
  const notaCDC = calcPillarNote(store.pillars.cdc.realized, store.pillars.cdc.meta);
  const notaServ = calcPillarNote(store.pillars.services.realized, store.pillars.services.meta);

  const scoreBase = calcScoreBase(notaMerc, notaCDC, notaServ);
  const penSpread = calcSpreadPenalty(notaMerc, notaCDC, notaServ);

  // Dependency Penalty
  const sortedSellers = [...sellers].sort((a, b) => b.pillars.mercantil.realized - a.pillars.mercantil.realized);
  const top1 = sortedSellers[0]?.pillars.mercantil.realized || 0;
  const top2 = sortedSellers[1]?.pillars.mercantil.realized || 0;
  const penDep = calcDependencyPenalty(top1, top2, store.pillars.mercantil.realized);

  const penTeamZero = calcTeamZeroPenalty(sellers);

  return clamp(scoreBase - penSpread - penDep - penTeamZero, 0, 100);
};

export const calcPeriodScoreSeller = (seller: Seller) => {
  const notaMerc = calcPillarNote(seller.pillars.mercantil.realized, seller.pillars.mercantil.meta);
  const notaCDC = calcPillarNote(seller.pillars.cdc.realized, seller.pillars.cdc.meta);
  const notaServ = calcPillarNote(seller.pillars.services.realized, seller.pillars.services.meta);

  const scoreBase = calcScoreBase(notaMerc, notaCDC, notaServ);
  const penSpread = calcSpreadPenalty(notaMerc, notaCDC, notaServ);
  const penZeros = calcZerosPenaltySeller(
    seller.pillars.mercantil.realized,
    seller.pillars.cdc.realized,
    seller.pillars.services.realized
  );

  return clamp(scoreBase - penSpread - penZeros, 0, 100);
};

export const calcTrend = (scores: number[]) => {
  if (scores.length < 3) return "Volátil/Estável";
  const s1 = scores[scores.length - 3];
  const s2 = scores[scores.length - 2];
  const s3 = scores[scores.length - 1];

  if (s1 < s2 && s2 < s3 && (s3 - s1) >= 5) return "Tendência de Alta";
  if (s1 > s2 && s2 > s3 && (s1 - s3) >= 5) return "Tendência de Queda";
  return "Volátil/Estável";
};

export const formatBRL = (val: number) => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatPercentBR = (val: number) => {
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
};
