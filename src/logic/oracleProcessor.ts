
import { OracleData, OracleResult, Seller, HistoryRecord, TrendAnalysis } from '../types/oracle';
import { 
  calculateICM, 
  calculateGap, 
  calculateHealthIndex, 
  classifyHealth, 
  classifySeller 
} from '../calculations/formulas';
import { generatePeriodLabel } from '../utils/formatters';

function analyzeTrend(values: number[]): string {
  if (values.length < 2) return "Dados insuficientes";
  
  // Check for consecutive growth or decline
  let growth = true;
  let decline = true;
  
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i+1] <= values[i]) growth = false;
    if (values[i+1] >= values[i]) decline = false;
  }
  
  if (growth && values.length >= 2) return "Tendência de alta consistente.";
  if (decline && values.length >= 2) return "Tendência de retração recorrente.";
  return "Volatilidade no desempenho.";
}

export function processOracle(data: OracleData, history: HistoryRecord[] = []): OracleResult {
  const result = JSON.parse(JSON.stringify(data)) as OracleResult;
  const { store, sellers } = result;

  // 0. Update Period Label and Timestamp
  store.period.label = generatePeriodLabel(store.period);
  result.generatedAt = new Date().toISOString();

  // 1. Calculate Store Pillars
  store.pillars.mercantil.icm = calculateICM(store.pillars.mercantil.realized, store.pillars.mercantil.meta);
  store.pillars.mercantil.gap = calculateGap(store.pillars.mercantil.meta, store.pillars.mercantil.realized);

  store.pillars.cdc.icm = calculateICM(store.pillars.cdc.realized, store.pillars.cdc.meta);
  store.pillars.cdc.gap = calculateGap(store.pillars.cdc.meta, store.pillars.cdc.realized);
  store.pillars.cdc.participation.achievement = calculateICM(store.pillars.cdc.participation.realized, store.pillars.cdc.participation.meta);

  store.pillars.services.icm = calculateICM(store.pillars.services.realized, store.pillars.services.meta);
  store.pillars.services.gap = calculateGap(store.pillars.services.meta, store.pillars.services.realized);
  store.pillars.services.efficiency.achievement = calculateICM(store.pillars.services.efficiency.realized, store.pillars.services.efficiency.meta);

  // Operational Store
  store.pillars.operational.cards.achievement = calculateICM(store.pillars.operational.cards.realized, store.pillars.operational.cards.meta);
  store.pillars.operational.combos.achievement = calculateICM(store.pillars.operational.combos.realized, store.pillars.operational.combos.meta);

  // 2. Store Health Index
  store.healthIndex = calculateHealthIndex(
    store.pillars.mercantil.icm,
    store.pillars.cdc.icm,
    store.pillars.services.icm
  );
  store.classification = classifyHealth(store.healthIndex);

  // 3. Store Triple Crown
  store.tripleCrownStatus = {
    mercantil: store.pillars.mercantil.icm >= 100,
    cdc: store.pillars.cdc.icm >= 100,
    services: store.pillars.services.icm >= 100
  };

  // 4. Process Sellers
  sellers.forEach(seller => {
    // Mercantil
    seller.pillars.mercantil.icm = calculateICM(seller.pillars.mercantil.realized, seller.pillars.mercantil.meta);
    seller.pillars.mercantil.gap = calculateGap(seller.pillars.mercantil.meta, seller.pillars.mercantil.realized);
    
    // CDC
    seller.pillars.cdc.icm = calculateICM(seller.pillars.cdc.realized, seller.pillars.cdc.meta);
    seller.pillars.cdc.gap = calculateGap(seller.pillars.cdc.meta, seller.pillars.cdc.realized);
    
    // Services
    seller.pillars.services.icm = calculateICM(seller.pillars.services.realized, seller.pillars.services.meta);
    seller.pillars.services.gap = calculateGap(seller.pillars.services.meta, seller.pillars.services.realized);

    // Score & Classification
    seller.score = calculateHealthIndex(
      seller.pillars.mercantil.icm,
      seller.pillars.cdc.icm,
      seller.pillars.services.icm
    );
    seller.classification = classifySeller(seller.score);
    seller.isTripleCrown = seller.pillars.mercantil.icm >= 100 && seller.pillars.cdc.icm >= 100 && seller.pillars.services.icm >= 100;
  });

  // 5. Intelligence Layer (History Based)
  const last3Records = history.slice(0, 3).reverse(); // Oldest to newest
  
  // Store Trends
  const storeMercantilHistory = [...last3Records.map(r => r.dados.store.pillars.mercantil.icm), store.pillars.mercantil.icm];
  const storeCDCHistory = [...last3Records.map(r => r.dados.store.pillars.cdc.icm), store.pillars.cdc.icm];
  const storeServicesHistory = [...last3Records.map(r => r.dados.store.pillars.services.icm), store.pillars.services.icm];

  const storeTrend: TrendAnalysis = {
    mercantil: analyzeTrend(storeMercantilHistory.slice(-3)),
    cdc: analyzeTrend(storeCDCHistory.slice(-3)),
    services: analyzeTrend(storeServicesHistory.slice(-3))
  };

  // Seller Intelligence
  sellers.forEach(seller => {
    const sellerHistory = last3Records.map(r => r.dados.sellers.find(s => s.name === seller.name)).filter(Boolean);
    const sellerScores = [...sellerHistory.map(s => s!.score), seller.score];
    
    const consistencyCount = sellerScores.filter(s => s >= 100).length;
    const consistency = (consistencyCount / sellerScores.length) * 100;
    
    let consistencyReading = "";
    if (consistency >= 70) consistencyReading = `${seller.name} apresenta alta consistência nos últimos períodos, mantendo entrega acima da meta.`;
    else if (consistency >= 40) consistencyReading = `${seller.name} demonstra oscilação no desempenho, alternando entre períodos de meta batida e retração.`;
    else consistencyReading = `${seller.name} demonstra instabilidade recorrente, com entregas abaixo da meta em mais da metade dos períodos.`;

    // Risk Alert
    let riskAlert = undefined;
    if (sellerScores.length >= 2) {
      const last2 = sellerScores.slice(-2);
      const drop = last2[0] - last2[1];
      if (drop > 10 || (last2[0] < 80 && last2[1] < 80)) {
        riskAlert = "Risco estrutural identificado. Queda recorrente pode comprometer fechamento.";
      }
    }

    seller.intelligence = {
      trend: {
        mercantil: analyzeTrend([...sellerHistory.map(s => s!.pillars.mercantil.icm), seller.pillars.mercantil.icm].slice(-3)),
        cdc: analyzeTrend([...sellerHistory.map(s => s!.pillars.cdc.icm), seller.pillars.cdc.icm].slice(-3)),
        services: analyzeTrend([...sellerHistory.map(s => s!.pillars.services.icm), seller.pillars.services.icm].slice(-3))
      },
      consistency,
      consistencyReading,
      riskAlert
    };
  });

  // Concentration & Radar
  let concentrationRisk = "Saudável";
  if (sellers.length > 0) {
    const sortedSellers = [...sellers].sort((a, b) => b.score - a.score);
    const totalScore = sellers.reduce((acc, s) => acc + s.score, 0);
    
    if (totalScore > 0) {
      const top2Score = sellers.length > 1 ? sortedSellers[0].score + sortedSellers[1].score : sortedSellers[0].score;
      const concentration = (top2Score / totalScore) * 100;
      
      if (concentration > 60) concentrationRisk = "Risco estratégico elevado por concentração excessiva.";
      else if (concentration > 50) concentrationRisk = "Alta dependência operacional em poucos nomes.";
    }
  }

  // Store Health Score (Weighted)
  const healthScore = calculateHealthIndex(
    store.pillars.mercantil.icm,
    store.pillars.cdc.icm,
    store.pillars.services.icm
  );
  let healthReading = "";
  if (healthScore >= 85) healthReading = "Operação saudável";
  else if (healthScore >= 70) healthReading = "Estável com atenção";
  else if (healthScore >= 50) healthReading = "Zona de alerta";
  else healthReading = "Risco estrutural";

  const pillars = [
    { name: 'Mercantil', icm: store.pillars.mercantil.icm },
    { name: 'CDC', icm: store.pillars.cdc.icm },
    { name: 'Serviços', icm: store.pillars.services.icm }
  ].sort((a, b) => b.icm - a.icm);

  const sortedSellersByScore = [...sellers].sort((a, b) => b.score - a.score);
  
  // Calculate General Trend with points
  let generalTrendText = "Estabilidade operacional.";
  if (history.length > 0) {
    const prevScore = history[0].dados.store.healthIndex;
    const currentScore = store.healthIndex;
    const diff = currentScore - prevScore;
    
    if (Math.abs(diff) < 2) {
      generalTrendText = "Estabilidade operacional.";
    } else if (diff > 0) {
      generalTrendText = `Tendência de alta (+${diff.toFixed(1)} pts).`;
    } else {
      generalTrendText = `Tendência de retração (${diff.toFixed(1)} pts).`;
    }
  }

  result.intelligence = {
    radar: {
      strongestPillar: pillars[0].name,
      vulnerablePillar: pillars[2].name,
      risingSeller: sortedSellersByScore[0]?.name || "N/A",
      riskySeller: sellers.find(s => s.intelligence?.riskAlert)?.name || "Nenhum",
      generalTrend: generalTrendText,
      dispersionLevel: sellers.length > 0 ? (sellers.filter(s => s.score < 80).length / sellers.length > 0.3 ? "Alta" : "Baixa") : "N/A"
    },
    storeTrend,
    concentrationRisk,
    healthScore,
    healthReading: `A loja opera em ${healthReading.toLowerCase()}, com pressão principal no ${pillars[2].name}.`
  };

  // 7. Distribution (Legacy Support)
  if (sellers.length > 0) {
    const sortedSellers = [...sellers].sort((a, b) => b.score - a.score);
    const totalScore = sellers.reduce((acc, s) => acc + s.score, 0);
    
    if (totalScore > 0) {
      result.distribution.top1Contribution = (sortedSellers[0].score / totalScore) * 100;
      result.distribution.top2Contribution = sellers.length > 1 
        ? ((sortedSellers[0].score + sortedSellers[1].score) / totalScore) * 100 
        : result.distribution.top1Contribution;
    }

    if (result.distribution.top1Contribution > 40) result.distribution.dependencyLevel = 'Crítica';
    else if (result.distribution.top1Contribution > 30) result.distribution.dependencyLevel = 'Alta';
    else if (result.distribution.top1Contribution > 20) result.distribution.dependencyLevel = 'Moderada';
    else result.distribution.dependencyLevel = 'Saudável';

    // MVP Selection
    const mvp = sortedSellers[0];
    result.mvpId = mvp.id;
    result.mvpJustification = `${mvp.name} atingiu o Score mais alto da operação (${mvp.score.toFixed(1)}%), demonstrando o melhor equilíbrio entre os pilares estratégicos e maior impacto no resultado global.`;
  }

  // 8. Maturity Index (Legacy Support)
  if (sellers.length > 0) {
    const above100 = sellers.filter(s => s.score >= 100).length;
    const below80 = sellers.filter(s => s.score < 80).length;
    
    result.maturityIndex.above100Percent = (above100 / sellers.length) * 100;
    result.maturityIndex.below80Percent = (below80 / sellers.length) * 100;
    
    if (result.maturityIndex.above100Percent >= 70) result.maturityIndex.classification = 'Alta Maturidade';
    else if (result.maturityIndex.above100Percent >= 40) result.maturityIndex.classification = 'Maturidade Moderada';
    else result.maturityIndex.classification = 'Baixa Maturidade';
  }

  // 9. Projection
  if (store.period.businessDaysTotal > 0) {
    const elapsed = store.period.businessDaysElapsed;
    const total = store.period.businessDaysTotal;
    const projectionFactor = elapsed > 0 ? total / elapsed : 0;
    
    result.projection.isAvailable = true;
    result.projection.mercantilProjected = store.pillars.mercantil.realized * projectionFactor;
    result.projection.cdcProjected = store.pillars.cdc.realized * projectionFactor;
    result.projection.servicesProjected = store.pillars.services.realized * projectionFactor;

    result.projection.mercantilGap = store.pillars.mercantil.meta - result.projection.mercantilProjected;
    result.projection.cdcGap = store.pillars.cdc.meta - result.projection.cdcProjected;
    result.projection.servicesGap = store.pillars.services.meta - result.projection.servicesProjected;

    const avgProjectedICM = calculateHealthIndex(
      (result.projection.mercantilProjected / (store.pillars.mercantil.meta || 1)) * 100,
      (result.projection.cdcProjected / (store.pillars.cdc.meta || 1)) * 100,
      (result.projection.servicesProjected / (store.pillars.services.meta || 1)) * 100
    );

    if (elapsed === 0) {
      result.projection.probability = 'Planejamento';
    } else if (avgProjectedICM >= 100) {
      result.projection.probability = 'Alta';
    } else if (avgProjectedICM >= 90) {
      result.projection.probability = 'Média';
    } else {
      result.projection.probability = 'Baixa';
    }
  } else {
    result.projection.isAvailable = false;
    result.projection.probability = 'Dados insuficientes';
  }

  return result;
}
