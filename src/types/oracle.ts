
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Period {
  type: PeriodType;
  label: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  businessDaysTotal: number;
  businessDaysElapsed: number;
}

export interface OperationalIndicator {
  meta: number;
  realized: number;
  achievement: number;
}

export interface PillarBase {
  meta: number;
  realized: number;
  icm: number;
  gap: number;
}

export interface CDCPillar extends PillarBase {
  participation: {
    meta: number;
    realized: number;
    achievement: number;
  };
}

export interface ServicesPillar extends PillarBase {
  efficiency: {
    meta: number;
    realized: number;
    achievement: number;
  };
}

export interface StorePillars {
  mercantil: PillarBase;
  cdc: CDCPillar;
  services: ServicesPillar;
  operational: {
    cards: OperationalIndicator;
    combos: OperationalIndicator;
  };
}

export interface Store {
  name: string;
  period: Period;
  pillars: StorePillars;
  healthIndex: number;
  classification: string;
  tripleCrownStatus: {
    mercantil: boolean;
    cdc: boolean;
    services: boolean;
  };
}

export interface SellerPillar {
  meta: number;
  realized: number;
  icm: number;
  gap: number;
}

export interface Seller {
  id: string;
  name: string;
  pillars: {
    mercantil: SellerPillar;
    cdc: SellerPillar;
    services: SellerPillar;
  };
  operational: {
    cards: { meta: number; realized: number };
    combos: { meta: number; realized: number };
  };
  score: number;
  classification: string;
  isTripleCrown: boolean;
  intelligence?: {
    trend: TrendAnalysis;
    consistency: number;
    consistencyReading: string;
    riskAlert?: string;
  };
}

export interface Distribution {
  top1Contribution: number;
  top2Contribution: number;
  dependencyLevel: string;
}

export interface MaturityIndex {
  above100Percent: number;
  below80Percent: number;
  classification: string;
}

export interface Projection {
  mercantilProjected: number;
  cdcProjected: number;
  servicesProjected: number;
  mercantilGap: number;
  cdcGap: number;
  servicesGap: number;
  probability: string;
  isAvailable: boolean;
}

export interface Simulator {
  scenario: string;
  newHealthIndex: number;
  newClassification: string;
}

export interface HistoryRecord {
  id: string;
  tipo: PeriodType;
  dataReferencia: string;
  dados: OracleData;
}

export interface OracleHistory {
  registros: HistoryRecord[];
}

export interface IntelligenceRadar {
  strongestPillar: string;
  vulnerablePillar: string;
  risingSeller: string;
  riskySeller: string;
  generalTrend: string;
  dispersionLevel: string;
}

export interface TrendAnalysis {
  mercantil: string;
  cdc: string;
  services: string;
}

export interface OracleData {
  store: Store;
  sellers: Seller[];
  distribution: Distribution;
  maturityIndex: MaturityIndex;
  projection: Projection;
  simulator: Simulator;
  history: any[];
  generatedAt: string;
  mvpJustification?: string;
  mvpId?: string;
  intelligence?: {
    radar: IntelligenceRadar;
    storeTrend: TrendAnalysis;
    concentrationRisk: string;
    healthScore: number;
    healthReading: string;
  };
}

export type OracleResult = OracleData;
