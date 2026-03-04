
import React from 'react';
import { PeriodContext } from '../types/oracle';
import { motion } from 'motion/react';
import { AlertCircle, Target, TrendingDown } from 'lucide-react';
import { calculateICM, calculateDistance } from '../calculations/formulas';

interface Props {
  context: PeriodContext;
}

export const OperationalBottleneckRadar: React.FC<Props> = ({ context }) => {
  const pillars = [
    { id: 'mercantil', label: 'Mercantil' },
    { id: 'cdc', label: 'CDC' },
    { id: 'servicos', label: 'Serviços' }
  ] as const;

  const analysis = pillars.map(p => {
    const icm = calculateICM(context.store[p.id].real, context.store[p.id].meta);
    const distance = calculateDistance(icm);
    const gap = context.store[p.id].meta - context.store[p.id].real;
    return { ...p, icm, distance, gap };
  }).sort((a, b) => b.distance - a.distance);

  const mainBottleneck = analysis[0];
  const allMet = analysis.every(a => a.distance === 0);

  if (allMet) {
    return (
      <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
          <Target size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-emerald-700 uppercase tracking-widest">Operação em Plenitude</h4>
          <p className="text-xs text-emerald-600 font-medium">Todas as metas do período foram atingidas ou superadas (ICM &gt;= 100%). Sem gargalos operacionais identificados.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
          <AlertCircle size={18} />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">
          Radar de Gargalo {context.mode === 'monthly' ? 'Sazonal' : 'Operacional'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analysis.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-5 rounded-3xl border transition-all ${
              idx === 0 ? 'bg-accent/5 border-accent/20 shadow-md' : 'bg-white border-zinc-100 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-black uppercase tracking-widest ${idx === 0 ? 'text-accent' : 'text-zinc-400'}`}>
                {item.label}
              </span>
              {idx === 0 && (
                <div className="px-2 py-0.5 bg-accent text-white text-[8px] font-black rounded-full uppercase tracking-tighter">
                  Gargalo Principal
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-zinc-400 uppercase block">
                ICM {context.mode === 'monthly' ? 'Sazonal' : 'Atual'}
              </span>
              <p className={`text-lg font-black ${idx === 0 ? 'text-accent' : 'text-zinc-900'}`}>
                {item.icm.toFixed(1)}%
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-end">
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-zinc-400 uppercase block">
                  Distância {context.mode === 'monthly' ? 'Sazonal' : 'da Meta'}
                </span>
                <span className={`text-sm font-black ${idx === 0 ? 'text-accent' : 'text-zinc-600'}`}>
                  {item.distance.toFixed(1)}%
                </span>
              </div>
              <div className="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${idx === 0 ? 'bg-accent' : 'bg-zinc-300'}`}
                  style={{ width: `${Math.min(100, item.distance)}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-zinc-900 rounded-2xl flex items-center gap-4 text-white">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
          <TrendingDown size={20} />
        </div>
        <p className="text-xs font-bold leading-relaxed">
          Gargalo principal da operação {context.mode === 'monthly' ? '(Sazonal)' : ''}: <span className="text-accent uppercase font-black">{mainBottleneck.label}</span>. 
          Este pilar apresenta a maior distância da meta {context.mode === 'monthly' ? 'esperada até hoje' : 'do período'} (<span className="text-accent font-black">{mainBottleneck.distance.toFixed(1)}%</span>), exigindo intervenção prioritária.
        </p>
      </div>
    </section>
  );
};
