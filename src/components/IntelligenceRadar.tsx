
import React from 'react';
import { OracleResult } from '../types/oracle';
import { motion } from 'motion/react';
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity,
  Target,
  ShieldAlert,
  BarChart3
} from 'lucide-react';

interface Props {
  data: OracleResult;
}

export const IntelligenceRadar: React.FC<Props> = ({ data }) => {
  const { intelligence } = data;
  if (!intelligence) return null;

  const { radar, storeTrend, concentrationRisk, healthScore, healthReading } = intelligence;

  const radarItems = [
    { label: 'Pilar mais Forte', value: radar.strongestPillar, icon: <Target size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pilar mais Vulnerável', value: radar.vulnerablePillar, icon: <AlertTriangle size={16} />, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Vendedor em Ascensão', value: radar.risingSeller, icon: <TrendingUp size={16} />, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Vendedor em Risco', value: radar.riskySeller, icon: <ShieldAlert size={16} />, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Tendência Geral', value: radar.generalTrend, icon: <Activity size={16} />, color: 'text-zinc-600', bg: 'bg-zinc-50' },
    { label: 'Dispersão do Time', value: radar.dispersionLevel, icon: <Users size={16} />, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <Zap size={20} className="text-accent" /> RADAR ESTRATÉGICO
        </h3>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
          healthScore >= 85 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          healthScore >= 70 ? 'bg-primary/10 text-primary border-primary/20' :
          healthScore >= 50 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-accent/10 text-accent border-accent/20'
        }`}>
          Score de Saúde: {healthScore.toFixed(1)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {radarItems.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 bg-white rounded-2xl border border-primary/10 shadow-sm flex items-start gap-3"
          >
            <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{item.label}</span>
              <p className="text-sm font-bold text-primary">{item.value}</p>
            </div>
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
