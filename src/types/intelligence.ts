
import { PeriodType } from './oracle';

export interface PillarComparison {
  name: string;
  baseReal: number;
  currentReal: number;
  deltaValue: number;
  deltaPercent: number;
  baseICM: number;
  currentICM: number;
}

export interface SellerComparison {
  id: string;
  name: string;
  baseScore: number;
  currentScore: number;
  deltaScore: number;
  baseRank: number;
  currentRank: number;
  deltaRank: number;
  alerts: string[];
}

export interface EvolutionAlert {
  type: 'A' | 'B' | 'C';
  title: string;
  reason: string;
  action: string;
}

export interface ComparisonResult {
  periodA: string;
  periodB: string;
  store: {
    pillars: PillarComparison[];
    baseScore: number;
    currentScore: number;
    deltaScore: number;
    classification: 'Evolução' | 'Estável' | 'Regressão';
    top2Share: number;
  };
  sellers: SellerComparison[];
  alerts: EvolutionAlert[];
  executiveSummary: string;
}

export interface HistoryPoint {
  periodId: string;
  label: string;
  score: number;
  mercantilReal: number;
  mercantilMeta: number;
  cdcReal: number;
  cdcMeta: number;
  servicesReal: number;
  servicesMeta: number;
  dependency: number;
  mercantilICM?: number;
  cdcICM?: number;
  servicesICM?: number;
}
