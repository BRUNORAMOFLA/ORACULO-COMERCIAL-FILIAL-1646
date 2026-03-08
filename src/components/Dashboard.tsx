
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { OracleData } from '../types/oracle';
import { usePhotoStorage } from '../hooks/usePhotoStorage';
import { 
  Activity, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Users, 
  ShieldAlert, 
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Package,
  Trophy,
  Star,
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { formatNumberBR, formatCurrencyBR } from '../utils/formatters';
import { FeedbackModal } from './FeedbackModal';
import { TripleCrownSellerItem } from './TripleCrownSellerItem';
import { Seller, OracleResult, HistoryRecord, PeriodType, OracleHistoryV1, PeriodContext } from '../types/oracle';
import { 
  calculateHealthIndex, 
  classifySeller, 
  calculateBalanceIndex, 
  classifySellerProfile,
  classifyHealth,
  calculateICM,
  calculateDistance
} from '../calculations/formulas';
import { IntelligenceRadar } from './IntelligenceRadar';
import { StrategicCommandPanel } from './StrategicCommandPanel';
import { StrategicPriorityBlock } from './StrategicPriorityBlock';
import { CollectiveImpactBlock } from './CollectiveImpactBlock';
import { OperationalBottleneckRadar } from './OperationalBottleneckRadar';
import { TeamDispersionBlock } from './TeamDispersionBlock';
import { SeasonalPaceBlock } from './SeasonalPaceBlock';
import { ProbabilityBlock } from './ProbabilityBlock';
import { 
  exportToExcel, 
  exportToPDF, 
  exportToPNG, 
  generateWhatsAppText 
} from '../utils/exporters';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Image as ImageIcon, 
  MessageSquare, 
  Share2,
  History as HistoryIcon,
  Clock,
  Sparkles
} from 'lucide-react';

interface Props {
  data: OracleResult;
  history: HistoryRecord[];
  fullHistory?: OracleHistoryV1;
}

export const Dashboard: React.FC<Props> = ({ data, history, fullHistory }) => {
  if (!data || !data.store || !data.store.pillars) {
    return (
      <div className="p-12 text-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
        <p className="text-sm text-zinc-500 font-bold uppercase">Aguardando dados para processamento...</p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'crown' | 'mvp'>('crown');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<'mercantil' | 'cdc' | 'services' | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // const EXCLUDED_SELLER = 'Caio';
  // const filteredSellers = data.sellers.filter(s => s.name?.toLowerCase() !== EXCLUDED_SELLER.toLowerCase());
  const filteredSellers = data.sellers;

  const periodContext = useMemo((): PeriodContext => {
    const mode = data.store.period.type;
    const currentMonth = data.store.period.month;
    const currentYear = data.store.period.year;
    const startDate = data.store.period.startDate;
    const endDate = data.store.period.endDate || data.store.period.date;

    // Initial fallback data (from the current report)
    let storeData = {
      mercantil: { 
        meta: data.store.pillars.mercantil.metaEsperada || data.store.pillars.mercantil.meta, 
        real: data.store.pillars.mercantil.realized,
        metaMensal: data.store.pillars.mercantil.metaMensal,
        metaEsperada: data.store.pillars.mercantil.metaEsperada
      },
      cdc: { 
        meta: data.store.pillars.cdc.metaEsperada || data.store.pillars.cdc.meta, 
        real: data.store.pillars.cdc.realized,
        metaMensal: data.store.pillars.cdc.metaMensal,
        metaEsperada: data.store.pillars.cdc.metaEsperada
      },
      services: { 
        meta: data.store.pillars.services.metaEsperada || data.store.pillars.services.meta, 
        real: data.store.pillars.services.realized,
        metaMensal: data.store.pillars.services.metaMensal,
        metaEsperada: data.store.pillars.services.metaEsperada
      }
    };

    let sellersData = filteredSellers.map(s => ({
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
        sellersData = filteredSellers.map(seller => {
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

        // 2. Calculate Store Data (Sum of Daily Metas, and Realized from Sellers Sum for consistency)
        storeData = {
          mercantil: {
            meta: data.store.pillars.mercantil.metaEsperada || periodDailyRecords.reduce((acc, r) => acc + (r.dados.store.pillars.mercantil.meta || 0), 0),
            real: sellersData.reduce((acc, s) => acc + s.mercantil.real, 0),
            metaMensal: data.store.pillars.mercantil.metaMensal,
            metaEsperada: data.store.pillars.mercantil.metaEsperada
          },
          cdc: {
            meta: data.store.pillars.cdc.metaEsperada || periodDailyRecords.reduce((acc, r) => acc + (r.dados.store.pillars.cdc.meta || 0), 0),
            real: sellersData.reduce((acc, s) => acc + s.cdc.real, 0),
            metaMensal: data.store.pillars.cdc.metaMensal,
            metaEsperada: data.store.pillars.cdc.metaEsperada
          },
          services: {
            meta: data.store.pillars.services.metaEsperada || periodDailyRecords.reduce((acc, r) => acc + (r.dados.store.pillars.services.meta || 0), 0),
            real: sellersData.reduce((acc, s) => acc + s.services.real, 0),
            metaMensal: data.store.pillars.services.metaMensal,
            metaEsperada: data.store.pillars.services.metaEsperada
          }
        };

        // Validation Rule: Check for inconsistencies with reported totals
        (['mercantil', 'cdc', 'services'] as const).forEach(p => {
          const summed = storeData[p].real;
          const reported = data.store.pillars[p].realized;
          if (Math.abs(summed - reported) > 1) {
            console.warn(`DIVERGÊNCIA SAZONAL: Pilar ${p} - Soma Vendedores (${summed}) vs Reportado (${reported}). Utilizando Soma para consistência.`);
          }
        });
      }
    }

    return {
      mode,
      startDate,
      endDate,
      businessDaysTotal: data.store.period.businessDaysTotal,
      businessDaysElapsed: data.store.period.businessDaysElapsed,
      store: storeData,
      sellers: sellersData
    };
  }, [data, fullHistory, filteredSellers]);

  const seasonalScore = useMemo(() => {
    const icmMerc = calculateICM(periodContext.store.mercantil.real, periodContext.store.mercantil.metaEsperada || periodContext.store.mercantil.meta);
    const icmCdc = calculateICM(periodContext.store.cdc.real, periodContext.store.cdc.metaEsperada || periodContext.store.cdc.meta);
    const icmServ = calculateICM(periodContext.store.services.real, periodContext.store.services.metaEsperada || periodContext.store.services.meta);
    
    const score = calculateHealthIndex(icmMerc, icmCdc, icmServ);
    
    return {
      score,
      icms: {
        mercantil: icmMerc,
        cdc: icmCdc,
        services: icmServ
      }
    };
  }, [periodContext]);

  const seasonalSellers = useMemo(() => {
    return periodContext.sellers.map(s => {
      const icmMerc = calculateICM(s.mercantil.real, s.mercantil.meta);
      const icmCdc = calculateICM(s.cdc.real, s.cdc.meta);
      const icmServ = calculateICM(s.services.real, s.services.meta);
      
      const score = calculateHealthIndex(icmMerc, icmCdc, icmServ);
      const originalSeller = filteredSellers.find(fs => fs.name === s.name);
      if (!originalSeller) return null;

      // Classificação Estratégica em Duas Camadas
      const icmList = [icmMerc, icmCdc, icmServ];
      const minICM = Math.min(...icmList);
      const maxICM = Math.max(...icmList);
      const spread = maxICM - minICM;
      const sortedIcms = [...icmList].sort((a, b) => b - a);
      const secondMaxICM = sortedIcms[1];

      // 1. Nível de Performance
      let nivelPerformance = "RISCO";
      if (score >= 120) nivelPerformance = "ELITE";
      else if (score >= 100) nivelPerformance = "ALTO";
      else if (score >= 80) nivelPerformance = "PARCIAL";

      // 2. Padrão Operacional (Ordem de Prioridade)
      let padrao = "DESEQUILÍBRIO OPERACIONAL";
      
      if (icmList.filter(v => v < 40).length >= 2) {
        padrao = "COLAPSO OPERACIONAL";
      } else if (minICM < 50) {
        padrao = "PILAR CRÍTICO";
      } else if (maxICM >= 150 && (maxICM - secondMaxICM) >= 40) {
        if (maxICM === icmMerc) padrao = "DEPENDÊNCIA DE MERCANTIL";
        else if (maxICM === icmCdc) padrao = "DEPENDÊNCIA DE CDC";
        else if (maxICM === icmServ) padrao = "DEPENDÊNCIA DE SERVIÇOS";
      } else if (minICM >= 110 && spread > 60) {
        padrao = "DOMINÂNCIA CONCENTRADA";
      } else if (minICM >= 100 && spread > 60 && minICM < 110) {
        padrao = "DOMINÂNCIA DESBALANCEADA";
      } else if (minICM >= 100 && spread <= 60) {
        padrao = "DOMINÂNCIA EQUILIBRADA";
      } else if (minICM >= 60 && minICM < 100) {
        padrao = "DESEQUILÍBRIO OPERACIONAL";
      }

      const strategicStatus = `${nivelPerformance} • ${padrao}`;

      return {
        ...originalSeller,
        pillars: {
          mercantil: { ...originalSeller.pillars.mercantil, icm: icmMerc, meta: s.mercantil.meta, realized: s.mercantil.real },
          cdc: { ...originalSeller.pillars.cdc, icm: icmCdc, meta: s.cdc.meta, realized: s.cdc.real },
          services: { ...originalSeller.pillars.services, icm: icmServ, meta: s.services.meta, realized: s.services.real },
        },
        score,
        classification: nivelPerformance,
        strategicStatus,
        profile: classifySellerProfile(score, calculateBalanceIndex([icmMerc, icmCdc, icmServ]), [icmMerc, icmCdc, icmServ])
      };
    }).filter(Boolean) as Seller[];
  }, [periodContext, filteredSellers]);

  const seasonalData = useMemo(() => {
    const sortedSeasonal = [...seasonalSellers].sort((a, b) => b.score - a.score);
    const mvp = sortedSeasonal[0];

    return {
      ...data,
      mvpId: mvp?.id || data.mvpId,
      mvpJustification: mvp 
        ? `${mvp.name} atingiu o Score Sazonal mais alto (${mvp.score.toFixed(1)}%), demonstrando consistência acumulada no período.`
        : data.mvpJustification,
      store: {
        ...data.store,
        pillars: {
          mercantil: { ...data.store.pillars.mercantil, meta: periodContext.store.mercantil.meta, realized: periodContext.store.mercantil.real, icm: seasonalScore.icms.mercantil },
          cdc: { ...data.store.pillars.cdc, meta: periodContext.store.cdc.meta, realized: periodContext.store.cdc.real, icm: seasonalScore.icms.cdc },
          services: { ...data.store.pillars.services, meta: periodContext.store.services.meta, realized: periodContext.store.services.real, icm: seasonalScore.icms.services },
          operational: data.store.pillars.operational
        },
        healthIndex: seasonalScore.score,
        classification: classifyHealth(seasonalScore.score)
      },
      sellers: seasonalSellers,
      intelligence: data.intelligence ? {
        ...data.intelligence,
        healthScore: seasonalScore.score,
        healthReading: classifyHealth(seasonalScore.score)
      } : undefined,
      strategicContext: data.strategicContext ? {
        ...data.strategicContext,
        mode: (periodContext.mode === 'daily' ? 'DIARIO' : 
               periodContext.mode === 'weekly' ? 'SEMANAL' : 'MENSAL') as 'DIARIO' | 'SEMANAL' | 'MENSAL'
      } : undefined
    } as OracleResult;
  }, [data, periodContext, seasonalScore, seasonalSellers]);

  const healthData = [
    { name: 'Saúde', value: seasonalScore.score },
    { name: 'Restante', value: Math.max(0, 100 - seasonalScore.score) },
  ];

  const COLORS = ['#0047BA', '#f4f4f5'];

  const getHealthColor = (classification: string) => {
    if (classification.includes('Alta')) return 'text-emerald-600';
    if (classification.includes('Competitiva')) return 'text-blue-600';
    if (classification.includes('Atenção')) return 'text-amber-600';
    return 'text-red-600';
  };

  const periodKey = (seasonalData.store.period.label || 'periodo').replace(/\s+/g, '_');
  const mvpPhoto = usePhotoStorage(`mvp_photo_${periodKey}`);
  const [activePhotoMenu, setActivePhotoMenu] = useState<'mvp' | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setActiveTooltip(null);
      }
      // Close photo menu if clicking outside
      if (activePhotoMenu) {
        setActivePhotoMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePhotoMenu]);

  const tripleCrownSellers = seasonalSellers.filter(s => s.isTripleCrown);
  const mvpSeller = seasonalSellers.find(s => s.id === seasonalData.mvpId);

  const filename = `Oraculo_Comercial_${seasonalData.store.name}_${(seasonalData.store.period.label || 'periodo').replace(/\//g, '-')}`;

  const getHorizonLabel = (type: PeriodType) => {
    switch (type) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      default: return 'Diário';
    }
  };

  const getHorizonBadge = (type: PeriodType) => {
    switch (type) {
      case 'daily': return { label: '🔵 TÁTICO', color: 'bg-blue-600' };
      case 'weekly': return { label: '🟡 TENDÊNCIA', color: 'bg-amber-500' };
      case 'monthly': return { label: '🔴 ESTRUTURAL', color: 'bg-red-600' };
      default: return { label: '🔵 TÁTICO', color: 'bg-blue-600' };
    }
  };

  const getOperationStatus = (score: number) => {
    if (score >= 100) return { label: '🟢 PERFORMANCE SUSTENTÁVEL', color: 'text-emerald-600' };
    if (score >= 80) return { label: '🟡 ZONA DE ATENÇÃO', color: 'text-amber-600' };
    return { label: '🔴 RISCO ESTRUTURAL', color: 'text-red-600' };
  };

  const isClosed = data.store.period.status === 'fechado';
  const isProjection = data.store.period.status === 'projecao';
  const isPartial = data.store.period.status === 'parcial';

  const bottleneckPillars = [
    { id: 'mercantil', label: 'Mercantil' },
    { id: 'cdc', label: 'CDC' },
    { id: 'services', label: 'Serviços' }
  ] as const;

  const bottleneckAnalysis = bottleneckPillars.map(p => {
    const icm = seasonalScore.icms[p.id];
    const distance = calculateDistance(icm);
    return { ...p, distance };
  }).sort((a, b) => b.distance - a.distance);

  const mainBottleneck = bottleneckAnalysis[0];
  const hasBottleneck = bottleneckAnalysis.some(a => a.distance > 0);

  const closedHistory = history
    .filter(r => r.dados.store.period.status === 'fechado')
    .sort((a, b) => {
      const pa = a.dados.store.period;
      const pb = b.dados.store.period;
      const dateA = pa.startDate || pa.date || `${pa.year}-${String(pa.month).padStart(2, '0')}-01`;
      const dateB = pb.startDate || pb.date || `${pb.year}-${String(pb.month).padStart(2, '0')}-01`;
      return dateB.localeCompare(dateA); // Newest first for list
    });

  if (periodContext.mode === 'monthly') {
    return (
      <div className="space-y-8" id="dashboard-content">
        {/* 1. CABEÇALHO DA UNIDADE */}
        <div className="bg-white p-8 rounded-3xl border border-primary/10 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-primary uppercase">{seasonalData.store.name}</h2>
                <p className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-wider">Relatório de Performance Estratégica • {seasonalData.store.period.label}</p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status da Operação:</span>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    seasonalScore.score >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                    seasonalScore.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-accent/10 text-accent'
                  }`}>
                    {classifyHealth(seasonalScore.score)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Horizonte:</span>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getHorizonBadge(seasonalData.store.period.type).color} text-white`}>
                    {getHorizonBadge(seasonalData.store.period.type).label}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative no-export">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
              >
                <Share2 size={16} className="text-accent" /> EXPORTAR RELATÓRIO
              </button>
              
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-black/5 p-2 z-[100] space-y-1"
                  >
                    <button 
                      onClick={() => { exportToExcel(data); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 transition-colors"
                    >
                      <FileSpreadsheet size={16} className="text-emerald-600" /> Excel Analítico
                    </button>
                    <button 
                      onClick={() => { exportToPDF('dashboard-content', filename); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 transition-colors"
                    >
                      <FileText size={16} className="text-red-600" /> PDF Executivo
                    </button>
                    <button 
                      onClick={() => { exportToPNG('dashboard-content', filename); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 transition-colors"
                    >
                      <ImageIcon size={16} className="text-blue-600" /> PNG Estilo Slide
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 2. SCORE SAZONAL + ICMs */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Trophy size={80} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">Score Sazonal</span>
            <div className="text-6xl font-black tracking-tighter mb-2">{(seasonalScore.score || 0).toFixed(1)}</div>
            <div className="px-4 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {classifyHealth(seasonalScore.score)}
            </div>
          </div>

          {(['mercantil', 'cdc', 'services'] as const).map((p) => {
            const icm = seasonalScore.icms[p];
            const label = p === 'services' ? 'Serviços' : p.toUpperCase();
            return (
              <div key={p} className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  <Target size={80} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">ICM {label} Sazonal</span>
                <div className="text-5xl font-black tracking-tighter text-primary mb-2">{(icm || 0).toFixed(1)}%</div>
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, icm || 0)}%` }}
                    className={`h-full ${(icm || 0) >= 100 ? 'bg-emerald-500' : (icm || 0) >= 80 ? 'bg-amber-500' : 'bg-accent'}`}
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* 3. RITMO SAZONAL DO MÊS */}
        <SeasonalPaceBlock context={periodContext} />

        {/* 4. RADAR DE GARGALO SAZONAL */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
          <OperationalBottleneckRadar context={periodContext} />
        </div>

        {/* 5. STATUS DA OPERAÇÃO SAZONAL */}
        <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-zinc-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📊</span>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Status da Operação Sazonal:</h3>
          </div>
          <div className={`text-3xl font-black tracking-tighter ${getOperationStatus(seasonalScore.score).color}`}>
            {getOperationStatus(seasonalScore.score).label}
          </div>
        </div>

        {/* 6. PERÍODO ATUAL */}
        <div className="bg-white p-8 rounded-3xl border border-primary/10 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Status do Ciclo</span>
              <h4 className="text-xl font-black text-primary uppercase">{seasonalData.store.period.label}</h4>
            </div>
            <div className="flex gap-8">
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Dias Decorridos</span>
                <span className="text-xl font-black text-primary">{seasonalData.store.period.businessDaysElapsed} / {seasonalData.store.period.businessDaysTotal}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-accent block">Gargalo Operacional</span>
                <span className="text-xl font-black text-zinc-900 uppercase">{hasBottleneck ? mainBottleneck.label : 'Nenhum'}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['mercantil', 'cdc', 'services'] as const).map(p => {
              const remainingDays = seasonalData.store.period.businessDaysTotal - seasonalData.store.period.businessDaysElapsed;
              const monthlyMeta = seasonalData.store.pillars[p].metaMensal || seasonalData.store.pillars[p].meta;
              const neededDaily = remainingDays > 0 ? Math.max(0, (monthlyMeta - seasonalData.store.pillars[p].realized) / remainingDays) : 0;
              return (
                <div key={p} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-zinc-400">{p === 'services' ? 'Serviços' : p}</span>
                    <span className="text-sm font-black text-primary">{(seasonalData.store.pillars[p].icm || 0).toFixed(1)}%</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">Realizado</span>
                    <span className="text-lg font-black text-zinc-900">{formatCurrencyBR(seasonalData.store.pillars[p].realized)}</span>
                  </div>
                  <div className="pt-4 border-t border-zinc-200">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Média Necessária</span>
                    <span className="text-sm font-black text-accent">{formatCurrencyBR(neededDaily)} / DIA</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PROBABILIDADE DE FECHAMENTO DA META */}
        <ProbabilityBlock context={periodContext} history={history} />

        {/* 7. PROJEÇÃO DO MÊS */}
        <div className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 block">Projeção Linear do Mês</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black">{seasonalData.projection.probability}</span>
                  <span className="text-xs font-bold uppercase text-white/70 tracking-widest">Probabilidade de Entrega</span>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Status Projetado</span>
                <span className="text-2xl font-black text-accent uppercase tracking-tighter">Em Evolução</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(['mercantil', 'cdc', 'services'] as const).map(p => (
                <div key={p} className="space-y-3 p-6 bg-white/10 rounded-3xl border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60 block">{p === 'services' ? 'Serviços' : p}</span>
                  <div className="space-y-1">
                    <span className="text-xl font-black block">{formatCurrencyBR(seasonalData.projection[`${p}Projected` as keyof typeof seasonalData.projection] as number)}</span>
                    <span className={`text-[10px] font-black uppercase ${seasonalData.projection[`${p}Gap` as keyof typeof seasonalData.projection] as number <= 0 ? 'text-emerald-400' : 'text-accent'}`}>
                      {seasonalData.projection[`${p}Gap` as keyof typeof seasonalData.projection] as number <= 0 ? 'Meta Superada' : `Gap: ${formatCurrencyBR(seasonalData.projection[`${p}Gap` as keyof typeof seasonalData.projection] as number)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 8. INTERVENÇÃO GERENCIAL */}
        {seasonalData.strategicContext && (
          <StrategicCommandPanel context={seasonalData.strategicContext} />
        )}

        {/* 9. RANKING DE PERFORMANCE INDIVIDUAL (Sazonal) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Ranking de Performance Individual (Sazonal)</h3>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Elite</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Alto</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Parcial</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent" /> Risco</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-zinc-400 border-b">
                  <th className="pb-4 px-2">Pos</th>
                  <th className="pb-4 px-2">Vendedor</th>
                  <th className="pb-4 px-2 text-center">Mercantil</th>
                  <th className="pb-4 px-2 text-center">CDC</th>
                  <th className="pb-4 px-2 text-center">Serviços</th>
                  <th className="pb-4 px-2 text-right">Score</th>
                  <th className="pb-4 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {[...seasonalSellers].sort((a, b) => b.score - a.score).map((s, idx) => (
                  <tr key={s.id} className="group hover:bg-zinc-50 transition-colors">
                    <td className="py-5 px-2 text-xs font-bold text-zinc-400">#{idx + 1}</td>
                    <td className="py-5 px-2">
                      <button onClick={() => setSelectedSeller(s)} className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left">
                        <span className="text-sm font-bold text-primary underline decoration-primary/20 underline-offset-4">{s.name}</span>
                        {s.isTripleCrown && <Award size={14} className="text-accent" />}
                      </button>
                    </td>
                    <td className="py-5 px-2 text-center text-xs font-medium text-zinc-600">{(s.pillars.mercantil.icm || 0).toFixed(1)}%</td>
                    <td className="py-5 px-2 text-center text-xs font-medium text-zinc-600">{(s.pillars.cdc.icm || 0).toFixed(1)}%</td>
                    <td className="py-5 px-2 text-center text-xs font-medium text-zinc-600">{(s.pillars.services.icm || 0).toFixed(1)}%</td>
                    <td className="py-5 px-2 text-right">
                      <span className="text-sm font-black text-primary">{(s.score || 0).toFixed(1)}%</span>
                    </td>
                    <td className="py-5 px-2 text-right">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full whitespace-nowrap ${
                        s.classification === 'ELITE' ? 'bg-emerald-50 text-emerald-700' :
                        s.classification === 'ALTO' ? 'bg-primary/10 text-primary' :
                        s.classification === 'PARCIAL' ? 'bg-amber-50 text-amber-700' :
                        'bg-accent/10 text-accent'
                      }`}>
                        {s.strategicStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 10. DISPERSÃO DO TIME */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
          <TeamDispersionBlock sellers={seasonalSellers} />
        </div>

        {/* 11. PRIORIDADE ESTRATÉGICA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StrategicPriorityBlock sellers={seasonalSellers} store={seasonalData.store} />
          <CollectiveImpactBlock sellers={seasonalSellers} store={seasonalData.store} />
        </div>

        {/* ANÁLISE POR INDICADOR (SAZONAL) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Análise por Indicador (Sazonal)</h3>
            </div>
            <div className="flex bg-zinc-100 p-1 rounded-lg w-full sm:w-auto">
              {[
                { id: 'mercantil', label: 'Mercantil' },
                { id: 'cdc', label: 'CDC' },
                { id: 'services', label: 'Serviços' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPillar(selectedPillar === p.id ? null : p.id as any)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${selectedPillar === p.id ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
                >
                  {p.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedPillar ? (
              <motion.div
                key={selectedPillar}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-50"
              >
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-zinc-400">Performance {selectedPillar}</span>
                  <div className="p-4 bg-zinc-50 rounded-2xl space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-black text-primary">{(seasonalData.store.pillars[selectedPillar].icm || 0).toFixed(1)}%</span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">ICM Entrega</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-zinc-400">REALIZADO</span>
                        <span className="text-zinc-900">{formatCurrencyBR(seasonalData.store.pillars[selectedPillar].realized)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-zinc-400">META</span>
                        <span className="text-zinc-900">{formatCurrencyBR(seasonalData.store.pillars[selectedPillar].meta)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <span className="text-[10px] font-black uppercase text-zinc-400">Top 5 Vendedores em {selectedPillar}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {seasonalSellers
                      .sort((a, b) => b.pillars[selectedPillar].realized - a.pillars[selectedPillar].realized)
                      .slice(0, 5)
                      .map((s, idx) => (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group hover:border-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-zinc-400">#{idx + 1}</span>
                            <span className="text-xs font-bold text-zinc-900">{s.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-primary block">{formatCurrencyBR(s.pillars[selectedPillar].realized)}</span>
                            <span className="text-[8px] font-bold text-zinc-400 uppercase">{(s.pillars[selectedPillar].icm || 0).toFixed(0)}% ICM</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <p className="text-xs font-bold text-zinc-400 uppercase">Selecione um indicador acima para ver detalhes</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 12. RECONHECIMENTO E DESTAQUES */}
        <div className="bg-white rounded-[2.5rem] border border-primary/10 shadow-sm overflow-hidden">
          <div className="p-8 border-b flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Reconhecimento e Destaques</h3>
            </div>
            <div className="flex bg-zinc-100 p-1.5 rounded-xl w-full sm:w-auto">
              {['crown', 'mvp'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black transition-all uppercase ${activeTab === tab ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
                >
                  {tab === 'crown' ? 'Tríplice Coroa' : 'MVP'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeTab === 'crown' ? (
                <motion.div key="crown" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                  <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-primary text-white rounded-3xl gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${Object.values(seasonalData.store.tripleCrownStatus).every(v => v) ? 'bg-accent' : 'bg-white/10'}`}>
                        <Award size={28} className="text-white" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-white/50 block tracking-widest mb-1">Status da Unidade</span>
                        <span className="text-lg font-black uppercase">{Object.values(seasonalData.store.tripleCrownStatus).every(v => v) ? 'TRÍPLICE COROA CONSOLIDADA' : 'EM BUSCA DA TRÍPLICE COROA'}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {['mercantil', 'cdc', 'services'].map(p => (
                        <div key={p} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${seasonalData.store.tripleCrownStatus[p as keyof typeof seasonalData.store.tripleCrownStatus] ? 'bg-emerald-500' : 'bg-white/10'}`}>
                          {p === 'services' ? 'Serviços' : p}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Vendedores Elegíveis (Sazonal)</h4>
                    {tripleCrownSellers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tripleCrownSellers.map(s => (
                          <TripleCrownSellerItem key={s.id} seller={s} onSelect={setSelectedSeller} periodKey={periodKey} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                        <p className="text-xs text-zinc-500 font-bold uppercase">Nenhum vendedor atingiu a Tríplice Coroa neste período.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="mvp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col md:flex-row items-center gap-12">
                  {mvpSeller ? (
                    <>
                      <div className="relative">
                        <div 
                          className="w-48 h-48 rounded-full bg-primary flex items-center justify-center shadow-2xl cursor-pointer relative overflow-hidden border-8 border-zinc-50"
                          onClick={() => mvpPhoto.photo ? setActivePhotoMenu('mvp') : mvpPhoto.triggerInput()}
                        >
                          {mvpPhoto.photo ? (
                            <img src={mvpPhoto.photo} alt={mvpSeller.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-6xl font-black text-white">{mvpSeller.name.charAt(0)}</span>
                          )}
                          <input type="file" ref={mvpPhoto.fileInputRef} onChange={mvpPhoto.handleFileChange} className="hidden" accept="image/*" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-accent p-4 rounded-full border-4 border-white shadow-xl">
                          <Trophy size={32} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase text-accent block tracking-[0.3em]">Most Valuable Player</span>
                          <button onClick={() => setSelectedSeller(mvpSeller)} className="text-4xl font-black text-primary hover:opacity-70 transition-opacity underline decoration-primary/20 underline-offset-8">
                            {mvpSeller.name}
                          </button>
                        </div>
                        <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 relative">
                          <span className="absolute -top-3 left-6 px-2 bg-white text-[8px] font-black text-zinc-400 uppercase tracking-widest">Justificativa Sazonal</span>
                          <p className="text-sm text-zinc-600 leading-relaxed italic font-medium">"{seasonalData.mvpJustification}"</p>
                        </div>
                        <div className="flex justify-center md:justify-start gap-8">
                          <div className="text-center">
                            <span className="text-[10px] font-black text-zinc-400 uppercase block tracking-widest mb-1">Score Sazonal</span>
                            <span className="text-2xl font-black text-zinc-900">{(mvpSeller.score || 0).toFixed(1)}%</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[10px] font-black text-zinc-400 uppercase block tracking-widest mb-1">Status</span>
                            <span className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">{mvpSeller.classification}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full text-center py-20">
                      <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">MVP indisponível (dados insuficientes)</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 13. GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm flex flex-col items-center relative">
            <div className="flex items-center justify-between w-full mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Performance Composta</h3>
              <button onClick={() => setActiveTooltip(activeTooltip === 'composite_performance' ? null : 'composite_performance')} className="text-zinc-300 hover:text-primary transition-colors">
                <Info size={16} />
              </button>
            </div>
            <div className="h-72 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={healthData} innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value" startAngle={210} endAngle={-30}>
                    {healthData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-6xl font-black text-primary">{(seasonalScore.score || 0).toFixed(1)}</span>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center mt-2">Score Sazonal</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-8">Execução por Pilar (Sazonal)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Mercantil', icm: seasonalScore.icms.mercantil, proj: seasonalData.projection.mercantilProjected / (seasonalData.store.pillars.mercantil.meta || 1) * 100 },
                  { name: 'CDC', icm: seasonalScore.icms.cdc, proj: seasonalData.projection.cdcProjected / (seasonalData.store.pillars.cdc.meta || 1) * 100 },
                  { name: 'Serviços', icm: seasonalScore.icms.services, proj: seasonalData.projection.servicesProjected / (seasonalData.store.pillars.services.meta || 1) * 100 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight={900} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} domain={[0, 120]} />
                  <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="icm" name="ICM Atual" fill="#0047BA" radius={[8, 8, 0, 0]} barSize={50} />
                  <Bar dataKey="proj" name="Projeção (%)" fill="#e4e4e7" radius={[8, 8, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 14. INTELIGÊNCIA ESTRATÉGICA */}
        <IntelligenceRadar data={seasonalData} />

        <AnimatePresence>
          {selectedSeller && (
            <FeedbackModal seller={selectedSeller} period={seasonalData.store.period} onClose={() => setSelectedSeller(null)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="dashboard-content">
      {/* CABEÇALHO EXECUTIVO (FIXO NO PDF) */}
      <div className="bg-white p-8 rounded-3xl border border-primary/10 shadow-sm relative overflow-hidden mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-primary">
              <span className="text-2xl">🧭</span>
              <h1 className="text-xl font-black uppercase tracking-tighter">Horizonte: {getHorizonLabel(seasonalData.store.period.type)}</h1>
            </div>
            <div className="flex items-center gap-3 text-zinc-500">
              <span className="text-2xl">📅</span>
              <p className="text-sm font-bold">Período: {seasonalData.store.period.label}</p>
            </div>
          </div>
          
          <div className={`px-6 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-xl ${getHorizonBadge(seasonalData.store.period.type).color}`}>
            {getHorizonBadge(seasonalData.store.period.type).label}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-export">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-primary uppercase tracking-tight">Painel de Inteligência Comercial</h2>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isClosed ? 'bg-emerald-100 text-emerald-700' : 
            isProjection ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isClosed ? 'Consolidado' : isProjection ? 'Em Projeção' : 'Período Ativo'}
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
          >
            <Share2 size={14} className="text-accent" /> EXPORTAR RELATÓRIO
          </button>
          
          <AnimatePresence>
            {showExportMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-black/5 p-2 z-[100] space-y-1"
              >
                <button 
                  onClick={() => { exportToExcel(data); setShowExportMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 transition-colors"
                >
                  <FileSpreadsheet size={16} className="text-emerald-600" /> Excel Analítico
                </button>
                <button 
                  onClick={() => { exportToPDF('dashboard-content', filename); setShowExportMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 transition-colors"
                >
                  <FileText size={16} className="text-red-600" /> PDF Executivo
                </button>
                <button 
                  onClick={() => { exportToPNG('dashboard-content', filename); setShowExportMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 transition-colors"
                >
                  <ImageIcon size={16} className="text-blue-600" /> PNG Estilo Slide
                </button>
                <a 
                  href={`https://wa.me/?text=${generateWhatsAppText(data)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowExportMenu(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 rounded-xl text-xs font-bold text-zinc-600 transition-colors"
                >
                  <MessageSquare size={16} className="text-emerald-500" /> Texto WhatsApp
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <IntelligenceRadar data={seasonalData} />

      {/* NÍVEL 1 — SITUAÇÃO DA LOJA */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Trophy size={80} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">
            Score Global
          </span>
          <div className="text-6xl font-black tracking-tighter mb-2">
            {(seasonalScore.score || 0).toFixed(1)}
          </div>
          <div className="px-4 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
            {classifyHealth(seasonalScore.score)}
          </div>
        </div>

        {(['mercantil', 'cdc', 'services'] as const).map((p, idx) => {
          const icm = seasonalScore.icms[p];
          const label = p === 'services' ? 'Serviços' : p.toUpperCase();
            
          return (
            <div key={p} className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/30 transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Target size={80} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
                ICM {label}
              </span>
              <div className="text-5xl font-black tracking-tighter text-primary mb-2">{(icm || 0).toFixed(1)}%</div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, icm || 0)}%` }}
                  className={`h-full ${(icm || 0) >= 100 ? 'bg-emerald-500' : (icm || 0) >= 80 ? 'bg-amber-500' : 'bg-accent'}`}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* NOVO BLOCO: RITMO SAZONAL (Removido pois é exclusivo da visão mensal acima) */}

      {/* NÍVEL 2 — DIAGNÓSTICO OPERACIONAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm space-y-8">
          <OperationalBottleneckRadar context={periodContext} />
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm space-y-8">
          <TeamDispersionBlock sellers={seasonalSellers} />
        </div>
      </div>

      {/* STATUS EXECUTIVO DA OPERAÇÃO */}
      <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-zinc-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📊</span>
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Status da Operação:
          </h3>
        </div>
        <div className={`text-3xl font-black tracking-tighter ${getOperationStatus(seasonalScore.score).color}`}>
          {getOperationStatus(seasonalScore.score).label}
        </div>
      </div>

      {/* LAYER 1: HISTÓRICO CONSOLIDADO */}
      {closedHistory.length > 0 && (
        <section className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b pb-4">
            <HistoryIcon size={18} className="text-zinc-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">1. Histórico Consolidado (Meses Fechados)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {closedHistory.slice(0, 4).map((record, idx) => (
              <div key={record.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">{record.dados.store.period.label}</span>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xl font-black text-primary">{record.dados.store.healthIndex.toFixed(1)}</span>
                    <span className="text-[8px] font-bold text-zinc-400 ml-1">SCORE</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-zinc-900">{record.dados.distribution.top1Contribution.toFixed(1)}%</span>
                    <span className="text-[8px] font-bold text-zinc-400 block uppercase">DEP.</span>
                  </div>
                </div>
                {idx < closedHistory.length - 1 && (
                  <div className="pt-2 border-t border-zinc-200 flex items-center gap-1">
                    {record.dados.store.healthIndex > closedHistory[idx+1].dados.store.healthIndex ? (
                      <TrendingUp size={12} className="text-emerald-500" />
                    ) : (
                      <TrendingDown size={12} className="text-accent" />
                    )}
                    <span className={`text-[9px] font-bold ${record.dados.store.healthIndex > closedHistory[idx+1].dados.store.healthIndex ? 'text-emerald-600' : 'text-accent'}`}>
                      {Math.abs(record.dados.store.healthIndex - closedHistory[idx+1].dados.store.healthIndex).toFixed(1)} pts vs anterior
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LAYER 2: PERÍODO ATUAL */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">2. Período Atual (Execução em Tempo Real)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Stats Card */}
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-primary/10 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Status do Ciclo</span>
                <h4 className="text-lg font-black text-primary">{seasonalData.store.period.label}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">Dias Decorridos</span>
                <span className="text-lg font-black text-primary">{seasonalData.store.period.businessDaysElapsed} / {seasonalData.store.period.businessDaysTotal}</span>
              </div>
            </div>

            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Gargalo Operacional Atual:</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-zinc-900 uppercase">{hasBottleneck ? mainBottleneck.label : 'Nenhum'}</span>
                <span className="text-xs font-bold text-accent ml-2">— {hasBottleneck ? mainBottleneck.distance.toFixed(1) : '0.0'}% de distância da meta</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['mercantil', 'cdc', 'services'] as const).map(p => {
                const remainingDays = seasonalData.store.period.businessDaysTotal - seasonalData.store.period.businessDaysElapsed;
                const neededDaily = remainingDays > 0 ? Math.max(0, (seasonalData.store.pillars[p].meta - seasonalData.store.pillars[p].realized) / remainingDays) : 0;
                
                return (
                  <div key={p} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-zinc-400">{p === 'services' ? 'Serviços' : p}</span>
                      <span className="text-[10px] font-black text-primary">{(seasonalData.store.pillars[p].icm || 0).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Realizado</span>
                      <span className="text-sm font-black text-zinc-900">{formatCurrencyBR(seasonalData.store.pillars[p].realized)}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase block">Média Necessária</span>
                      <span className="text-[10px] font-black text-accent">{formatCurrencyBR(neededDaily)} / DIA</span>
                    </div>
                    <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${Math.min(100, seasonalData.store.pillars[p].icm)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projection Card */}
          <div className="bg-primary text-white p-6 rounded-3xl shadow-xl shadow-primary/20 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={80} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-2">
                Projeção Linear {seasonalData.store.period.type === 'daily' ? 'do Dia' : seasonalData.store.period.type === 'weekly' ? 'da Semana' : 'do Mês'}
              </span>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-black">{seasonalData.projection.probability}</span>
                <span className="text-[10px] font-bold uppercase text-white/70">Probabilidade</span>
              </div>
              
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-2">
                  Projeção Linear {seasonalData.store.period.type === 'daily' ? 'do Dia' : seasonalData.store.period.type === 'weekly' ? 'da Semana' : 'do Mês'}
                </span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black">{seasonalData.projection.probability}</span>
                  <span className="text-[10px] font-bold uppercase text-white/70">Probabilidade</span>
                </div>
                
                <div className="space-y-4">
                  {(['mercantil', 'cdc', 'services'] as const).map(p => (
                    <div key={p} className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-[10px] font-bold uppercase text-white/60">{p === 'services' ? 'Serviços' : p}</span>
                      <div className="text-right">
                        <span className="text-xs font-black block">{formatCurrencyBR(seasonalData.projection[`${p}Projected` as keyof typeof seasonalData.projection] as number)}</span>
                        <span className={`text-[8px] font-bold uppercase ${seasonalData.projection[`${p}Gap` as keyof typeof seasonalData.projection] as number <= 0 ? 'text-emerald-400' : 'text-accent'}`}>
                          {seasonalData.projection[`${p}Gap` as keyof typeof seasonalData.projection] as number <= 0 ? 'Meta Atingida' : `Faltam ${formatCurrencyBR(seasonalData.projection[`${p}Gap` as keyof typeof seasonalData.projection] as number)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NÍVEL 3 — INTERVENÇÃO GERENCIAL */}
      <section className="space-y-8">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Nível 3 — Intervenção Gerencial</h3>
        </div>

        {/* STRATEGIC CONTEXT BLOCKS */}
        {seasonalData.strategicContext && (
          <StrategicCommandPanel context={seasonalData.strategicContext} />
        )}

        {/* Seller Rankings */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase text-zinc-400">
              Ranking de Performance Individual
            </h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Elite</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Alto</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Parcial</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent" /> Risco</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-zinc-400 border-b">
                  <th className="pb-3 px-2">Pos</th>
                  <th className="pb-3 px-2">Vendedor</th>
                  <th className="pb-3 px-2 text-center">Mercantil</th>
                  <th className="pb-3 px-2 text-center">CDC</th>
                  <th className="pb-3 px-2 text-center">Serviços</th>
                  <th className="pb-3 px-2 text-right">Score</th>
                  <th className="pb-3 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {[...seasonalSellers].sort((a, b) => b.score - a.score).map((s, idx) => (
                  <tr key={s.id} className="group hover:bg-zinc-50 transition-colors">
                    <td className="py-4 px-2 text-xs font-bold text-zinc-400">#{idx + 1}</td>
                    <td className="py-4 px-2">
                      <button 
                        onClick={() => setSelectedSeller(s)}
                        className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left"
                      >
                        <span className="text-sm font-bold text-primary underline decoration-primary/20 underline-offset-4">{s.name || `Vendedor ${idx + 1}`}</span>
                        {s.isTripleCrown && <Award size={14} className="text-accent" />}
                      </button>
                    </td>
                    <td className="py-4 px-2 text-center text-xs font-medium text-zinc-600">{(s.pillars.mercantil.icm || 0).toFixed(1)}%</td>
                    <td className="py-4 px-2 text-center text-xs font-medium text-zinc-600">{(s.pillars.cdc.icm || 0).toFixed(1)}%</td>
                    <td className="py-4 px-2 text-center text-xs font-medium text-zinc-600">{(s.pillars.services.icm || 0).toFixed(1)}%</td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-primary">{(s.score || 0).toFixed(1)}%</span>
                        {s.intelligence?.trend.mercantil.includes('alta') ? <TrendingUp size={10} className="text-emerald-500" /> : 
                         s.intelligence?.trend.mercantil.includes('retração') ? <TrendingDown size={10} className="text-accent" /> : null}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full whitespace-nowrap ${
                            s.classification === 'ELITE' ? 'bg-emerald-50 text-emerald-700' :
                            s.classification === 'ALTO' ? 'bg-primary/10 text-primary' :
                            s.classification === 'PARCIAL' ? 'bg-amber-50 text-amber-700' :
                            'bg-accent/10 text-accent'
                          }`}>
                            {s.strategicStatus}
                          </span>
                          {s.profile && (
                            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${
                              s.profile.includes('DOMINANTE EQUILIBRADO') ? 'border-emerald-200 text-emerald-600 bg-emerald-50/50' :
                              s.profile.includes('DOMINANTE DESBALANCEADO') ? 'border-amber-200 text-amber-600 bg-amber-50/50' :
                              s.profile.includes('VOLUME FRÁGIL') ? 'border-accent/20 text-accent bg-accent/5' :
                              'border-zinc-200 text-zinc-500 bg-zinc-50'
                            }`}>
                              {s.profile}
                            </span>
                          )}
                        </div>
                        {s.intelligence?.riskAlert && (
                          <div className="flex items-center gap-1 text-[8px] font-bold text-accent uppercase">
                            <ShieldAlert size={10} /> Risco
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StrategicPriorityBlock 
            sellers={seasonalSellers} 
            store={seasonalData.store} 
          />
          <CollectiveImpactBlock 
            sellers={seasonalSellers} 
            store={seasonalData.store} 
          />
        </div>
      </section>

      {/* LAYER 3: TENDÊNCIA FUTURA (Removido pois é exclusivo da visão mensal acima) */}

      {/* Indicator Deep Dive */}
      <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Análise por Indicador</h3>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-lg w-full sm:w-auto">
            {[
              { id: 'mercantil', label: 'Mercantil' },
              { id: 'cdc', label: 'CDC' },
              { id: 'services', label: 'Serviços' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPillar(selectedPillar === p.id ? null : p.id as any)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${selectedPillar === p.id ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
              >
                {p.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedPillar ? (
            <motion.div
              key={selectedPillar}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-50"
            >
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase text-zinc-400">Performance {selectedPillar}</span>
                <div className="p-4 bg-zinc-50 rounded-2xl space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-primary">{(seasonalData.store.pillars[selectedPillar].icm || 0).toFixed(1)}%</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">ICM Entrega</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-zinc-400">REALIZADO</span>
                      <span className="text-zinc-900">{formatCurrencyBR(seasonalData.store.pillars[selectedPillar].realized)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-zinc-400">META</span>
                      <span className="text-zinc-900">{formatCurrencyBR(seasonalData.store.pillars[selectedPillar].meta)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <span className="text-[10px] font-black uppercase text-zinc-400">Top 5 Vendedores em {selectedPillar}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {seasonalSellers
                    .sort((a, b) => b.pillars[selectedPillar].realized - a.pillars[selectedPillar].realized)
                    .slice(0, 5)
                    .map((s, idx) => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-zinc-400">#{idx + 1}</span>
                          <span className="text-xs font-bold text-zinc-900">{s.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-primary block">{formatCurrencyBR(s.pillars[selectedPillar].realized)}</span>
                          <span className="text-[8px] font-bold text-zinc-400 uppercase">{(s.pillars[selectedPillar].icm || 0).toFixed(0)}% ICM</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <p className="text-xs font-bold text-zinc-400 uppercase">Selecione um indicador acima para ver detalhes</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Recognition Section */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-zinc-900" />
            <h3 className="text-xs font-bold uppercase text-zinc-900">Reconhecimento e Destaques</h3>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-lg w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('crown')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'crown' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              TRÍPLICE COROA
            </button>
            <button 
              onClick={() => setActiveTab('mvp')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'mvp' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              MVP
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 min-h-[200px]">
          <AnimatePresence mode="wait">
            {activeTab === 'crown' ? (
              <motion.div 
                key="crown"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-primary text-white rounded-xl gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${Object.values(seasonalData.store.tripleCrownStatus).every(v => v) ? 'bg-accent' : 'bg-white/10'}`}>
                      <Award size={20} className="text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-white/50 block">Status da Unidade</span>
                      <span className="text-sm font-bold">{Object.values(seasonalData.store.tripleCrownStatus).every(v => v) ? 'TRÍPLICE COROA CONSOLIDADA' : 'EM BUSCA DA TRÍPLICE COROA'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-center">
                    {['mercantil', 'cdc', 'services'].map(p => (
                      <div key={p} className={`px-2 py-1 rounded text-[8px] font-black uppercase ${seasonalData.store.tripleCrownStatus[p as keyof typeof seasonalData.store.tripleCrownStatus] ? 'bg-emerald-500' : 'bg-white/10'}`}>
                        {p === 'services' ? 'Serviços' : p}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400">Vendedores Elegíveis</h4>
                  {tripleCrownSellers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tripleCrownSellers.map(s => (
                        <TripleCrownSellerItem 
                          key={s.id} 
                          seller={s} 
                          onSelect={setSelectedSeller} 
                          periodKey={periodKey}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">Nenhum vendedor atingiu a Tríplice Coroa neste período.</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="mvp"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col md:flex-row items-center gap-8"
              >
                {mvpSeller ? (
                  <>
                    <div className="relative">
                      <div 
                        className="w-32 h-32 rounded-full bg-primary flex items-center justify-center shadow-2xl cursor-pointer relative overflow-hidden"
                        onClick={() => {
                          if (mvpPhoto.photo) {
                            setActivePhotoMenu('mvp');
                          } else {
                            mvpPhoto.triggerInput();
                          }
                        }}
                      >
                        {mvpPhoto.photo ? (
                          <img src={mvpPhoto.photo} alt={mvpSeller.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl font-black text-white">{mvpSeller.name.charAt(0)}</span>
                        )}

                        <input 
                          type="file" 
                          ref={mvpPhoto.fileInputRef} 
                          onChange={mvpPhoto.handleFileChange} 
                          className="hidden" 
                          accept="image/*"
                        />

                        <AnimatePresence>
                          {activePhotoMenu === 'mvp' && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 z-10"
                            >
                              <button 
                                onClick={(e) => { e.stopPropagation(); mvpPhoto.triggerInput(); setActivePhotoMenu(null); }}
                                className="text-[10px] font-bold uppercase hover:text-accent transition-colors"
                              >
                                Trocar Foto
                              </button>
                              <div className="w-8 h-[1px] bg-white/20" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); mvpPhoto.removePhoto(); setActivePhotoMenu(null); }}
                                className="text-[10px] font-bold uppercase hover:text-red-400 transition-colors"
                              >
                                Remover Foto
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-accent p-2 rounded-full border-4 border-white">
                        <Trophy size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div>
                        <span className="text-[10px] font-black uppercase text-accent block tracking-widest">Most Valuable Player</span>
                        <button 
                          onClick={() => setSelectedSeller(mvpSeller)}
                          className="text-2xl font-black text-primary hover:opacity-70 transition-opacity underline decoration-primary/20 underline-offset-4"
                        >
                          {mvpSeller.name}
                        </button>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <p className="text-xs text-zinc-600 leading-relaxed italic">"{seasonalData.mvpJustification}"</p>
                      </div>
                      <div className="flex justify-center md:justify-start gap-4">
                        <div className="text-center">
                          <span className="text-[8px] font-bold text-zinc-400 uppercase block">Score</span>
                          <span className="text-sm font-black text-zinc-900">{(mvpSeller.score || 0).toFixed(1)}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] font-bold text-zinc-400 uppercase block">Status</span>
                          <span className="text-sm font-black text-zinc-900">{mvpSeller.classification}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center py-12">
                    <p className="text-sm text-zinc-500 font-bold uppercase">MVP indisponível (dados insuficientes)</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Gauge */}
        <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col items-center relative">
          <div className="flex items-center justify-between w-full mb-6">
            <h3 className="text-xs font-bold uppercase text-zinc-400">Performance Composta</h3>
            <button 
              onClick={() => setActiveTooltip(activeTooltip === 'composite_performance' ? null : 'composite_performance')}
              className="text-zinc-300 hover:text-primary transition-colors"
            >
              <Info size={14} />
            </button>
          </div>
          <AnimatePresence>
            {activeTooltip === 'composite_performance' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-4 right-4 top-full mt-1 p-3 bg-white rounded-xl shadow-2xl border border-primary/10 z-50 text-[10px] font-medium text-zinc-600 leading-relaxed"
                ref={tooltipRef}
              >
                Representação visual da saúde geral da loja. O Score é a média ponderada: Mercantil (40%), CDC (30%) e Serviços (30%).
              </motion.div>
            )}
          </AnimatePresence>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={210}
                  endAngle={-30}
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-5xl font-black text-primary">
                {(seasonalScore.score || 0).toFixed(1)}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">
                Score Global
              </span>
            </div>
          </div>
        </div>

        {/* Pillars Performance */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-primary/10 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-zinc-400 mb-6">
            Execução por Pilar
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { 
                  name: 'Mercantil', 
                  icm: seasonalScore.icms.mercantil, 
                  proj: seasonalData.projection.mercantilProjected / (seasonalData.store.pillars.mercantil.meta || 1) * 100 
                },
                { 
                  name: 'CDC', 
                  icm: seasonalScore.icms.cdc, 
                  proj: seasonalData.projection.cdcProjected / (seasonalData.store.pillars.cdc.meta || 1) * 100 
                },
                { 
                  name: 'Serviços', 
                  icm: seasonalScore.icms.services, 
                  proj: seasonalData.projection.servicesProjected / (seasonalData.store.pillars.services.meta || 1) * 100 
                },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight={700} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} domain={[0, 120]} />
                <Tooltip 
                  cursor={{ fill: '#f8f9fa' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="icm" name="ICM Atual" fill="#0047BA" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="proj" name="Projeção (%)" fill="#e4e4e7" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSeller && (
          <FeedbackModal 
            seller={selectedSeller} 
            period={seasonalData.store.period} 
            onClose={() => setSelectedSeller(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
