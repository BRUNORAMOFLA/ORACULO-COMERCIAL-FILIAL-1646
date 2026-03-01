
import React, { useState, useRef, useEffect } from 'react';
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
  Info
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
import { Seller, OracleResult } from '../types/oracle';
import { IntelligenceRadar } from './IntelligenceRadar';
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
  Share2 
} from 'lucide-react';

interface Props {
  data: OracleResult;
}

export const Dashboard: React.FC<Props> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'crown' | 'mvp'>('crown');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<'mercantil' | 'cdc' | 'services' | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const periodKey = data.store.period.label.replace(/\s+/g, '_');
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

  const healthData = [
    { name: 'Saúde', value: data.store.healthIndex },
    { name: 'Restante', value: Math.max(0, 100 - data.store.healthIndex) },
  ];

  const COLORS = ['#0047BA', '#f4f4f5'];

  const getHealthColor = (classification: string) => {
    if (classification.includes('Alta')) return 'text-emerald-600';
    if (classification.includes('Competitiva')) return 'text-blue-600';
    if (classification.includes('Atenção')) return 'text-amber-600';
    return 'text-red-600';
  };

  const tripleCrownSellers = data.sellers.filter(s => s.isTripleCrown);
  const mvpSeller = data.sellers.find(s => s.id === data.mvpId);

  const filename = `Oraculo_Comercial_${data.store.name}_${data.store.period.label.replace(/\//g, '-')}`;

  // Tooltip Logic
  const getHealthTooltip = () => {
    const { pillars, healthIndex, classification } = data.store;
    return `Saúde calculada com base no ICM médio ponderado dos pilares:
Mercantil: ${pillars.mercantil.icm.toFixed(1)}%
CDC: ${pillars.cdc.icm.toFixed(1)}%
Serviços: ${pillars.services.icm.toFixed(1)}%
Resultado final: ${healthIndex.toFixed(1)}% classificado como ${classification}.`;
  };

  const getOperationalTooltip = () => {
    const { operational } = data.store.pillars;
    const totalMeta = operational.cards.meta + operational.combos.meta;
    const totalReal = operational.cards.realized + operational.combos.realized;
    const percent = totalMeta > 0 ? (totalReal / totalMeta) * 100 : 0;

    if (totalMeta === 0) return "Indicador sem meta definida no período.";

    return `Execução operacional baseada na conversão de Cartões e Combos.
Meta: ${totalMeta}
Realizado: ${totalReal}
Entrega: ${percent.toFixed(1)}%.`;
  };

  const getDependencyTooltip = () => {
    const { top1Contribution } = data.distribution;
    const topSeller = data.sellers.sort((a, b) => b.score - a.score)[0];
    return `Dependência calculada com base na concentração de resultado.
Maior concentração em: ${topSeller?.name || 'N/A'}
Participação: ${top1Contribution.toFixed(1)}% do total.`;
  };

  const getProjectionTooltip = () => {
    const { period, pillars } = data.store;
    const dailyAvg = period.businessDaysElapsed > 0 ? pillars.mercantil.realized / period.businessDaysElapsed : 0;
    const remainingDays = period.businessDaysTotal - period.businessDaysElapsed;
    const projection = data.projection.mercantilProjected;

    return `Projeção baseada na média diária atual:
Média diária: ${formatCurrencyBR(dailyAvg)}
Dias úteis restantes: ${remainingDays}
Projeção estimada: ${formatCurrencyBR(projection)}.`;
  };

  const getMaturityTooltip = () => {
    const sorted = [...data.sellers].sort((a, b) => b.score - a.score);
    const dispersion = sorted.length > 0 ? sorted[0].score - sorted[sorted.length - 1].score : 0;
    const above90 = data.sellers.length > 0 ? (data.sellers.filter(s => s.score > 90).length / data.sellers.length) * 100 : 0;

    return `Maturidade avaliada pela estabilidade da equipe:
Desvio entre melhor e pior vendedor: ${dispersion.toFixed(1)} pontos.
Percentual de vendedores acima de 90%: ${above90.toFixed(1)}%.`;
  };

  return (
    <div className="space-y-8" id="dashboard-content">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-export">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-primary uppercase tracking-tight">Painel de Inteligência Comercial</h2>
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

      <IntelligenceRadar data={data} />
      
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
                    <span className="text-2xl font-black text-primary">{data.store.pillars[selectedPillar].icm.toFixed(1)}%</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">ICM Entrega</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-zinc-400">REALIZADO</span>
                      <span className="text-zinc-900">{formatCurrencyBR(data.store.pillars[selectedPillar].realized)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-zinc-400">META</span>
                      <span className="text-zinc-900">{formatCurrencyBR(data.store.pillars[selectedPillar].meta)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <span className="text-[10px] font-black uppercase text-zinc-400">Top 5 Vendedores em {selectedPillar}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.sellers
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
                          <span className="text-[8px] font-bold text-zinc-400 uppercase">{s.pillars[selectedPillar].icm.toFixed(0)}% ICM</span>
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

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Saúde da Unidade</span>
            <button 
              onClick={() => setActiveTooltip(activeTooltip === 'health' ? null : 'health')}
              className="text-zinc-300 hover:text-primary transition-colors"
            >
              <Info size={14} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">{data.store.healthIndex.toFixed(1)}%</span>
            <span className={`text-[9px] font-bold uppercase ${getHealthColor(data.store.classification)}`}>{data.store.classification}</span>
          </div>
          <AnimatePresence>
            {activeTooltip === 'health' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-4 right-4 top-full mt-1 p-3 bg-white rounded-xl shadow-2xl border border-primary/10 z-50 text-[10px] font-medium text-zinc-600 leading-relaxed whitespace-pre-line"
                ref={tooltipRef}
              >
                {getHealthTooltip()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Execução Operacional</span>
            <button 
              onClick={() => setActiveTooltip(activeTooltip === 'operational' ? null : 'operational')}
              className="text-zinc-300 hover:text-primary transition-colors"
            >
              <Info size={14} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">
              {((data.store.pillars.operational.cards.achievement + data.store.pillars.operational.combos.achievement) / 2).toFixed(0)}%
            </span>
            <span className="text-[9px] font-bold uppercase text-zinc-500">Cartões/Combos</span>
          </div>
          <AnimatePresence>
            {activeTooltip === 'operational' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-4 right-4 top-full mt-1 p-3 bg-white rounded-xl shadow-2xl border border-primary/10 z-50 text-[10px] font-medium text-zinc-600 leading-relaxed whitespace-pre-line"
                ref={tooltipRef}
              >
                {getOperationalTooltip()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Nível de Dependência</span>
            <button 
              onClick={() => setActiveTooltip(activeTooltip === 'dependency' ? null : 'dependency')}
              className="text-zinc-300 hover:text-primary transition-colors"
            >
              <Info size={14} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-primary">{data.distribution.top1Contribution.toFixed(1)}%</span>
            <span className="text-[9px] font-bold uppercase text-zinc-500">{data.distribution.dependencyLevel}</span>
          </div>
          <AnimatePresence>
            {activeTooltip === 'dependency' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-4 right-4 top-full mt-1 p-3 bg-white rounded-xl shadow-2xl border border-primary/10 z-50 text-[10px] font-medium text-zinc-600 leading-relaxed whitespace-pre-line"
                ref={tooltipRef}
              >
                {getDependencyTooltip()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Projeção de Fechamento</span>
            <button 
              onClick={() => setActiveTooltip(activeTooltip === 'projection' ? null : 'projection')}
              className="text-zinc-300 hover:text-primary transition-colors"
            >
              <Info size={14} />
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-primary">{data.projection.probability}</span>
              <span className="text-[9px] font-bold uppercase text-zinc-500">Tendência</span>
            </div>
            <p className="text-[8px] font-bold text-zinc-400 uppercase">Base: média diária × dias úteis restantes</p>
          </div>
          <AnimatePresence>
            {activeTooltip === 'projection' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-4 right-4 top-full mt-1 p-3 bg-white rounded-xl shadow-2xl border border-primary/10 z-50 text-[10px] font-medium text-zinc-600 leading-relaxed whitespace-pre-line"
                ref={tooltipRef}
              >
                {getProjectionTooltip()}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-primary text-white p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-white/50 block">Período de Análise</span>
            <span className="text-sm font-bold">{data.store.period.label || "Período não definido"}</span>
          </div>
          <Calendar size={20} className="text-accent" />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm flex items-center justify-between relative">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">Maturidade do Time</span>
            <span className="text-sm font-bold text-primary">{data.maturityIndex.classification}</span>
          </div>
          <button 
            onClick={() => setActiveTooltip(activeTooltip === 'maturity' ? null : 'maturity')}
            className="text-zinc-300 hover:text-primary transition-colors"
          >
            <Info size={20} />
          </button>
          <AnimatePresence>
            {activeTooltip === 'maturity' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-4 right-4 top-full mt-1 p-3 bg-white rounded-xl shadow-2xl border border-primary/10 z-50 text-[10px] font-medium text-zinc-600 leading-relaxed whitespace-pre-line"
                ref={tooltipRef}
              >
                {getMaturityTooltip()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Projection Details */}
      {data.projection.isAvailable ? (
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-zinc-400 mb-6">Detalhamento da Projeção</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Mercantil', proj: data.projection.mercantilProjected, gap: data.projection.mercantilGap, meta: data.store.pillars.mercantil.meta },
              { label: 'CDC', proj: data.projection.cdcProjected, gap: data.projection.cdcGap, meta: data.store.pillars.cdc.meta },
              { label: 'Serviços', proj: data.projection.servicesProjected, gap: data.projection.servicesGap, meta: data.store.pillars.services.meta },
            ].map((p) => (
              <div key={p.label} className="p-4 bg-zinc-50 rounded-xl space-y-3">
                <span className="text-[10px] font-black uppercase text-zinc-400">{p.label}</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-black text-zinc-900">{formatCurrencyBR(p.proj)}</span>
                  <span className="text-[10px] font-bold text-zinc-500">Projetado</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-zinc-400">GAP VS META</span>
                  <span className={p.gap <= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {p.gap <= 0 ? 'META ATINGIDA' : formatCurrencyBR(p.gap)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-700 text-xs font-bold text-center">
          Projeção indisponível (dados insuficientes para cálculo de tendência)
        </div>
      )}

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
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${Object.values(data.store.tripleCrownStatus).every(v => v) ? 'bg-accent' : 'bg-white/10'}`}>
                      <Award size={20} className="text-white" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-white/50 block">Status da Unidade</span>
                      <span className="text-sm font-bold">{Object.values(data.store.tripleCrownStatus).every(v => v) ? 'TRÍPLICE COROA CONSOLIDADA' : 'EM BUSCA DA TRÍPLICE COROA'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-center">
                    {['mercantil', 'cdc', 'services'].map(p => (
                      <div key={p} className={`px-2 py-1 rounded text-[8px] font-black uppercase ${data.store.tripleCrownStatus[p as keyof typeof data.store.tripleCrownStatus] ? 'bg-emerald-500' : 'bg-white/10'}`}>
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
                        <p className="text-xs text-zinc-600 leading-relaxed italic">"{data.mvpJustification}"</p>
                      </div>
                      <div className="flex justify-center md:justify-start gap-4">
                        <div className="text-center">
                          <span className="text-[8px] font-bold text-zinc-400 uppercase block">Score</span>
                          <span className="text-sm font-black text-zinc-900">{mvpSeller.score.toFixed(1)}%</span>
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
              <span className="text-5xl font-black text-primary">{data.store.healthIndex.toFixed(0)}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Score Global</span>
            </div>
          </div>
        </div>

        {/* Pillars Performance */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-primary/10 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-zinc-400 mb-6">Execução por Pilar</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Mercantil', icm: data.store.pillars.mercantil.icm, proj: data.projection.mercantilProjected / (data.store.pillars.mercantil.meta || 1) * 100 },
                { name: 'CDC', icm: data.store.pillars.cdc.icm, proj: data.projection.cdcProjected / (data.store.pillars.cdc.meta || 1) * 100 },
                { name: 'Serviços', icm: data.store.pillars.services.icm, proj: data.projection.servicesProjected / (data.store.pillars.services.meta || 1) * 100 },
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

      {/* Seller Rankings */}
      <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase text-zinc-400">Ranking de Performance Individual</h3>
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
              {data.sellers.sort((a, b) => b.score - a.score).map((s, idx) => (
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
                  <td className="py-4 px-2 text-center text-xs font-medium text-zinc-600">{s.pillars.mercantil.icm.toFixed(1)}%</td>
                  <td className="py-4 px-2 text-center text-xs font-medium text-zinc-600">{s.pillars.cdc.icm.toFixed(1)}%</td>
                  <td className="py-4 px-2 text-center text-xs font-medium text-zinc-600">{s.pillars.services.icm.toFixed(1)}%</td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-primary">{s.score.toFixed(1)}%</span>
                      {s.intelligence?.trend.mercantil.includes('alta') ? <TrendingUp size={10} className="text-emerald-500" /> : 
                       s.intelligence?.trend.mercantil.includes('retração') ? <TrendingDown size={10} className="text-accent" /> : null}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                        s.classification === 'Elite' ? 'bg-emerald-50 text-emerald-700' :
                        s.classification === 'Alto Contribuidor' ? 'bg-primary/10 text-primary' :
                        s.classification === 'Parcial' ? 'bg-amber-50 text-amber-700' :
                        'bg-accent/10 text-accent'
                      }`}>
                        {s.classification}
                      </span>
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

      <AnimatePresence>
        {selectedSeller && (
          <FeedbackModal 
            seller={selectedSeller} 
            period={data.store.period} 
            onClose={() => setSelectedSeller(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
