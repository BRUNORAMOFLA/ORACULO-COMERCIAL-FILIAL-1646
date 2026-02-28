
import React, { useState, useRef, useEffect } from 'react';
import { OracleResult, Seller } from '../types/oracle';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  Target,
  ShieldAlert,
  BarChart3,
  Info
} from 'lucide-react';

interface Props {
  data: OracleResult;
}

export const IntelligenceRadar: React.FC<Props> = ({ data }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setActiveTooltip(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { intelligence, store, sellers } = data;
  if (!intelligence) return null;

  const { radar, storeTrend, concentrationRisk, healthScore, healthReading } = intelligence;

  const pillars = [
    { name: 'Mercantil', icm: store.pillars.mercantil.icm },
    { name: 'CDC', icm: store.pillars.cdc.icm },
    { name: 'Serviços', icm: store.pillars.services.icm }
  ].sort((a, b) => b.icm - a.icm);

  const sortedSellers = [...sellers].sort((a, b) => b.score - a.score);
  const maxScore = sortedSellers.length > 0 ? sortedSellers[0].score : 0;
  const minScore = sortedSellers.length > 0 ? sortedSellers[sortedSellers.length - 1].score : 0;
  const dispersion = maxScore - minScore;

  const getDispersionClass = (d: number) => {
    if (d > 40) return "Alta";
    if (d >= 20) return "Moderada";
    return "Baixa";
  };

  const getRisingSellerTooltip = () => {
    const seller = sellers.find(s => s.name === radar.risingSeller);
    if (!seller) return "Maior ICM médio entre os vendedores no ciclo atual.";
    return `Maior ICM médio entre os vendedores no ciclo atual, com score de ${seller.score.toFixed(1)}%.`;
  };

  const getRiskySellerTooltip = () => {
    const seller = sellers.find(s => s.name === radar.riskySeller);
    if (!seller || radar.riskySeller === "Nenhum") return "Nenhum vendedor identificado em patamar crítico de risco.";
    
    const lowPillars = [];
    if (seller.pillars.mercantil.icm < 60) lowPillars.push('Mercantil');
    if (seller.pillars.cdc.icm < 60) lowPillars.push('CDC');
    if (seller.pillars.services.icm < 60) lowPillars.push('Serviços');
    
    return `ICM médio de ${seller.score.toFixed(1)}%, com ${lowPillars.length > 0 ? lowPillars.join(', ') : 'pilares'} abaixo do patamar crítico (60%).`;
  };

  const getTrendTooltip = () => {
    if (radar.generalTrend.includes('alta')) {
      return `Tendência de alta identificada. O Score global subiu em relação ao ciclo anterior, indicando evolução operacional.`;
    }
    if (radar.generalTrend.includes('retração')) {
      return `Tendência de retração identificada. O Score global apresentou queda em relação ao ciclo anterior.`;
    }
    return `Oscilação inferior a 2 pontos, indicando estabilidade operacional no Score global.`;
  };

  const radarItems = [
    { 
      id: 'forte',
      label: 'Pilar mais Forte', 
      value: radar.strongestPillar, 
      icon: <Target size={16} />, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      tooltip: `ICM de ${pillars[0].name} em ${pillars[0].icm.toFixed(1)}%, sendo o maior entre os pilares no ciclo atual.`
    },
    { 
      id: 'vulneravel',
      label: 'Pilar mais Vulnerável', 
      value: radar.vulnerablePillar, 
      icon: <AlertTriangle size={16} />, 
      color: 'text-accent', 
      bg: 'bg-accent/10',
      tooltip: `ICM de ${pillars[2].name} em ${pillars[2].icm.toFixed(1)}%, menor desempenho relativo no período, impactando a sustentação global.`
    },
    { 
      id: 'ascensao',
      label: 'Vendedor em Ascensão', 
      value: radar.risingSeller, 
      icon: <TrendingUp size={16} />, 
      color: 'text-primary', 
      bg: 'bg-primary/10',
      tooltip: getRisingSellerTooltip()
    },
    { 
      id: 'risco',
      label: 'Vendedor em Risco', 
      value: radar.riskySeller, 
      icon: <ShieldAlert size={16} />, 
      color: 'text-accent', 
      bg: 'bg-accent/10',
      tooltip: getRiskySellerTooltip()
    },
    { 
      id: 'tendencia',
      label: 'Tendência Geral', 
      value: radar.generalTrend, 
      icon: <Activity size={16} />, 
      color: 'text-zinc-600', 
      bg: 'bg-zinc-50',
      tooltip: getTrendTooltip()
    },
    { 
      id: 'dispersao',
      label: 'Dispersão do Time', 
      value: radar.dispersionLevel, 
      icon: <Users size={16} />, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      tooltip: `Diferença de ${dispersion.toFixed(1)} pontos percentuais entre melhor e pior vendedor no ciclo. Classificação: ${getDispersionClass(dispersion)} (Alta > 40, Moderada 20-40, Baixa < 20).`
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <Zap size={20} className="text-accent" /> RADAR ESTRATÉGICO
        </h3>
        <div className="relative">
          <div 
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 cursor-pointer ${
              healthScore >= 85 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              healthScore >= 70 ? 'bg-primary/10 text-primary border-primary/20' :
              healthScore >= 50 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-accent/10 text-accent border-accent/20'
            }`}
            onClick={() => setActiveTooltip(activeTooltip === 'health' ? null : 'health')}
          >
            Score de Saúde: {healthScore.toFixed(1)}
            <Info size={10} className="opacity-50" />
          </div>
          <AnimatePresence>
            {activeTooltip === 'health' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute right-0 top-full mt-2 w-64 p-3 bg-white rounded-xl shadow-xl border border-primary/10 z-50 text-[10px] font-medium text-zinc-600 leading-relaxed"
                ref={tooltipRef}
              >
                Score calculado com base na média ponderada de Mercantil (40%), CDC (30%) e Serviços (30%).
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {radarItems.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 bg-white rounded-2xl border border-primary/10 shadow-sm flex items-start gap-3 relative"
          >
            <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{item.label}</span>
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === item.id ? null : item.id)}
                  className="text-zinc-300 hover:text-primary transition-colors"
                >
                  <Info size={12} />
                </button>
              </div>
              <p className="text-sm font-bold text-primary">{item.value}</p>
            </div>

            <AnimatePresence>
              {activeTooltip === item.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute left-4 right-4 top-full mt-1 p-3 bg-white rounded-xl shadow-2xl border border-primary/10 z-50 text-[10px] font-medium text-zinc-600 leading-relaxed"
                  ref={tooltipRef}
                >
                  {item.tooltip}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-primary rounded-3xl text-white space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <Activity size={20} />
            <h4 className="text-xs font-black uppercase tracking-widest">Leitura de Saúde</h4>
          </div>
          <p className="text-lg font-medium leading-relaxed">
            {healthReading}
          </p>
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-white/50 font-medium italic">
              *Análise ponderada: 40% Mercantil, 30% CDC, 30% Serviços.
            </p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-primary/10 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 size={20} />
            <h4 className="text-xs font-black uppercase tracking-widest">Tendência por Pilar</h4>
          </div>
          <div className="space-y-4">
            {Object.entries(storeTrend).map(([pilar, trend], idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <span className="text-xs font-bold uppercase text-zinc-500">{pilar}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{trend}</span>
                  {trend.includes('alta') ? <TrendingUp size={14} className="text-emerald-500" /> : 
                   trend.includes('retração') ? <TrendingDown size={14} className="text-accent" /> : 
                   <Activity size={14} className="text-amber-500" />}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-3">
            <ShieldAlert size={18} className="text-accent" />
            <p className="text-xs font-bold text-accent">{concentrationRisk}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
