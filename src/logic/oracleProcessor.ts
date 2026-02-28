
import { OracleData, OracleResult, Seller } from '../types/oracle';
import { 
  calculateICM, 
  calculateGap, 
  calculateHealthIndex, 
  classifyHealth, 
  classifySeller 
} from '../calculations/formulas';
import { generatePeriodLabel } from '../utils/formatters';

export function processOracle(data: OracleData): OracleResult {
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

  // 5. Distribution (Dependency)
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

  // 6. Maturity Index (Dispersion)
  if (sellers.length > 0) {
    const above100 = sellers.filter(s => s.score >= 100).length;
    const below80 = sellers.filter(s => s.score < 80).length;
    
    result.maturityIndex.above100Percent = (above100 / sellers.length) * 100;
    result.maturityIndex.below80Percent = (below80 / sellers.length) * 100;
    
    if (result.maturityIndex.above100Percent >= 70) result.maturityIndex.classification = 'Alta Maturidade';
    else if (result.maturityIndex.above100Percent >= 40) result.maturityIndex.classification = 'Maturidade Moderada';
    else result.maturityIndex.classification = 'Baixa Maturidade';
  }

  // 7. Projection
  if (store.period.businessDaysElapsed > 0 && store.period.businessDaysTotal > 0) {
    const projectionFactor = store.period.businessDaysTotal / store.period.businessDaysElapsed;
    
    result.projection.isAvailable = true;
    result.projection.mercantilProjected = store.pillars.mercantil.realized * projectionFactor;
    result.projection.cdcProjected = store.pillars.cdc.realized * projectionFactor;
    result.projection.servicesProjected = store.pillars.services.realized * projectionFactor;

    result.projection.mercantilGap = store.pillars.mercantil.meta - result.projection.mercantilProjected;
    result.projection.cdcGap = store.pillars.cdc.meta - result.projection.cdcProjected;
    result.projection.servicesGap = store.pillars.services.meta - result.projection.servicesProjected;

    const avgProjectedICM = (
      (result.projection.mercantilProjected / (store.pillars.mercantil.meta || 1)) * 40 +
      (result.projection.cdcProjected / (store.pillars.cdc.meta || 1)) * 30 +
      (result.projection.servicesProjected / (store.pillars.services.meta || 1)) * 30
    );

    if (avgProjectedICM >= 100) result.projection.probability = 'Alta';
    else if (avgProjectedICM >= 90) result.projection.probability = 'Média';
    else result.projection.probability = 'Baixa';
  } else {
    result.projection.isAvailable = false;
    result.projection.probability = 'Dados insuficientes';
  }

  return result;
}
