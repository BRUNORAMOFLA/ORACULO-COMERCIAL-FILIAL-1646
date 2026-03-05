
import { OracleData, OracleResult, OracleHistoryV1, Seller } from '../types/oracle';
import { 
  calculateICM, 
  calculateHealthIndex, 
  classifyHealth, 
  classifySeller, 
  classifySellerProfile,
  calculateBalanceIndex,
  calculateGap
} from '../calculations/formulas';

export function getSeasonalData(data: OracleData, fullHistory: OracleHistoryV1): OracleResult {
  const mode = data.store.period.type;
  const currentMonth = data.store.period.month;
  const currentYear = data.store.period.year;
  const startDate = data.store.period.startDate;
  const endDate = data.store.period.endDate || data.store.period.date;

  // Initial fallback data (from the current report)
  let storeData = {
    mercantil: { meta: data.store.pillars.mercantil.meta, real: data.store.pillars.mercantil.realized },
    cdc: { meta: data.store.pillars.cdc.meta, real: data.store.pillars.cdc.realized },
    services: { meta: data.store.pillars.services.meta, real: data.store.pillars.services.realized }
  };

  let sellersData = data.sellers.map(s => ({
    name: s.name,
    mercantil: { meta: s.pillars.mercantil.meta, real: s.pillars.mercantil.realized },
    cdc: { meta: s.pillars.cdc.meta, real: s.pillars.cdc.realized },
    services: { meta: s.pillars.services.meta, real: s.pillars.services.realized }
  }));

  // If we have daily history, we MUST use it to calculate seasonal sums
  if (fullHistory && fullHistory.diario) {
    const periodDailyRecords = fullHistory.diario.filter(r => {
      const p = r.dados.store.period;
      if (p.type !== 'daily') return false;
      
      const recordDate = p.date;
      if (!recordDate) return false;

      if (mode === 'daily') {
        return recordDate === data.store.period.date;
      }
      if (mode === 'weekly') {
        return recordDate >= (startDate || '') && recordDate <= (endDate || '');
      }
      if (mode === 'monthly') {
        let recordMonth = p.month;
        let recordYear = p.year;
        const [y, m] = recordDate.split('-').map(Number);
        recordMonth = m;
        recordYear = y;
        return recordMonth === currentMonth && recordYear === currentYear;
      }
      return false;
    });

    if (periodDailyRecords.length > 0) {
      // 1. Calculate Sellers Data first (Sum of Daily Metas and Realized)
      sellersData = data.sellers.map(seller => {
        const sellerDailyRecords = periodDailyRecords.map(r => 
          r.dados.sellers.find(s => s.name?.trim().toLowerCase() === seller.name?.trim().toLowerCase())
        ).filter(Boolean);

        return {
          name: seller.name,
          mercantil: {
            meta: sellerDailyRecords.reduce((acc, s) => acc + (s?.pillars.mercantil.meta || 0), 0),
            real: sellerDailyRecords.reduce((acc, s) => acc + (s?.pillars.mercantil.realized || 0), 0)
          },
          cdc: {
            meta: sellerDailyRecords.reduce((acc, s) => acc + (s?.pillars.cdc.meta || 0), 0),
            real: sellerDailyRecords.reduce((acc, s) => acc + (s?.pillars.cdc.realized || 0), 0)
          },
          services: {
            meta: sellerDailyRecords.reduce((acc, s) => acc + (s?.pillars.services.meta || 0), 0),
            real: sellerDailyRecords.reduce((acc, s) => acc + (s?.pillars.services.realized || 0), 0)
          }
        };
      });

      // 2. Calculate Store Data
      storeData = {
        mercantil: {
          meta: periodDailyRecords.reduce((acc, r) => acc + (r.dados.store.pillars.mercantil.meta || 0), 0),
          real: sellersData.reduce((acc, s) => acc + s.mercantil.real, 0)
        },
        cdc: {
          meta: periodDailyRecords.reduce((acc, r) => acc + (r.dados.store.pillars.cdc.meta || 0), 0),
          real: sellersData.reduce((acc, s) => acc + s.cdc.real, 0)
        },
        services: {
          meta: periodDailyRecords.reduce((acc, r) => acc + (r.dados.store.pillars.services.meta || 0), 0),
          real: sellersData.reduce((acc, s) => acc + s.services.real, 0)
        }
      };
    }
  }

  const icmMerc = calculateICM(storeData.mercantil.real, storeData.mercantil.meta);
  const icmCdc = calculateICM(storeData.cdc.real, storeData.cdc.meta);
  const icmServ = calculateICM(storeData.services.real, storeData.services.meta);
  const storeScore = calculateHealthIndex(icmMerc, icmCdc, icmServ);

  const seasonalSellers = sellersData.map(s => {
    const sIcmMerc = calculateICM(s.mercantil.real, s.mercantil.meta);
    const sIcmCdc = calculateICM(s.cdc.real, s.cdc.meta);
    const sIcmServ = calculateICM(s.services.real, s.services.meta);
    const sScore = calculateHealthIndex(sIcmMerc, sIcmCdc, sIcmServ);
    const originalSeller = data.sellers.find(fs => fs.name === s.name)!;

    const icms = [sIcmMerc, sIcmCdc, sIcmServ];
    const balance = calculateBalanceIndex(icms);

    return {
      ...originalSeller,
      pillars: {
        mercantil: { ...originalSeller.pillars.mercantil, icm: sIcmMerc, meta: s.mercantil.meta, realized: s.mercantil.real, gap: calculateGap(s.mercantil.meta, s.mercantil.real) },
        cdc: { ...originalSeller.pillars.cdc, icm: sIcmCdc, meta: s.cdc.meta, realized: s.cdc.real, gap: calculateGap(s.cdc.meta, s.cdc.real) },
        services: { ...originalSeller.pillars.services, icm: sIcmServ, meta: s.services.meta, realized: s.services.real, gap: calculateGap(s.services.meta, s.services.real) },
      },
      score: sScore,
      classification: classifySeller(sScore),
      profile: classifySellerProfile(sScore, balance, icms),
      isTripleCrown: sIcmMerc >= 100 && sIcmCdc >= 100 && sIcmServ >= 100
    };
  });

  const sortedSeasonal = [...seasonalSellers].sort((a, b) => b.score - a.score);
  const mvp = sortedSeasonal[0];

  const result: OracleResult = {
    ...data,
    mvpId: mvp?.id || data.mvpId,
    mvpJustification: mvp 
      ? `${mvp.name} atingiu o Score Sazonal mais alto (${mvp.score.toFixed(1)}%), demonstrando consistência acumulada no período.`
      : data.mvpJustification,
    store: {
      ...data.store,
      pillars: {
        mercantil: { ...data.store.pillars.mercantil, meta: storeData.mercantil.meta, realized: storeData.mercantil.real, icm: icmMerc, gap: calculateGap(storeData.mercantil.meta, storeData.mercantil.real) },
        cdc: { ...data.store.pillars.cdc, meta: storeData.cdc.meta, realized: storeData.cdc.real, icm: icmCdc, gap: calculateGap(storeData.cdc.meta, storeData.cdc.real) },
        services: { ...data.store.pillars.services, meta: storeData.services.meta, realized: storeData.services.real, icm: icmServ, gap: calculateGap(storeData.services.meta, storeData.services.real) },
        operational: data.store.pillars.operational
      },
      healthIndex: storeScore,
      classification: classifyHealth(storeScore),
      tripleCrownStatus: {
        mercantil: icmMerc >= 100,
        cdc: icmCdc >= 100,
        services: icmServ >= 100
      }
    },
    sellers: seasonalSellers,
    intelligence: data.intelligence ? {
      ...data.intelligence,
      healthScore: storeScore,
      healthReading: classifyHealth(storeScore)
    } : undefined,
    strategicContext: data.strategicContext ? {
      ...data.strategicContext,
      mode: mode.toUpperCase() as any
    } : undefined
  };

  return result;
}
