
import React, { useMemo } from 'react';
import { PeriodContext } from '../types/oracle';
import { motion } from 'motion/react';
import { Clock, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrencyBR } from '../utils/formatters';
import { calculateICM } from '../calculations/formulas';

interface Props {
  context: PeriodContext;
}

export const SeasonalPaceBlock: React.FC<Props> = ({ context }) => {
  const seasonalAnalysis = useMemo(() => {
    const pillars = ['mercantil', 'cdc', 'services'] as const;

    return pillars.map(p => {
      const expectedAccumulatedMeta = context.store[p].meta;
      const accumulatedRealized = context.store[p].real;
      const gapSazonal = accumulatedRealized - expectedAccumulatedMeta;
      const icm = calculateICM(accumulatedRealized, expectedAccumulatedMeta);
      
      let status: 'above' | 'warning' | 'critical' = 'above';
      if (accumulatedRealized < expectedAccumulatedMeta) {
        if (accumulatedRealized >= expectedAccumulatedMeta * 0.95) {
          status = 'warning';
        } else {
          status = 'critical';
        }
      }

      return {
        id: p,
        label: p === 'services' ? 'Serviços' : p.toUpperCase(),
        expectedAccumulatedMeta,
        accumulatedRealized,
        gapSazonal,
        icm,
        status
      };
    });
  }, [context]);

  if (context.mode !== 'monthly') return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          <Clock size={18} />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">
          Ritmo Sazonal do Mês
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {seasonalAnalysis.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 bg-white rounded-3xl border border-zinc-100 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {item.label}
              </span>
              {item.status === 'above' ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : item.status === 'warning' ? (
                <AlertCircle size={16} className="text-amber-500" />
              ) : (
                <AlertCircle size={16} className="text-accent" />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold text-zinc-400 uppercase">Meta Acumulada Esperada</span>
                <span className="text-xs font-bold text-zinc-900">{formatCurrencyBR(item.expectedAccumulatedMeta)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold text-zinc-400 uppercase">Realizado Acumulado</span>
                <span className="text-xs font-black text-primary">{formatCurrencyBR(item.accumulatedRealized)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold text-zinc-400 uppercase">ICM Sazonal</span>
                <span className={`text-xs font-black ${item.icm >= 100 ? 'text-emerald-600' : item.icm >= 95 ? 'text-amber-600' : 'text-accent'}`}>
                  {(item.icm || 0).toFixed(1)}%
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-100 flex justify-between items-center">
                <span className="text-[8px] font-black text-zinc-400 uppercase">Gap Sazonal</span>
                <div className="flex items-center gap-1">
                  {item.gapSazonal >= 0 ? (
                    <TrendingUp size={12} className="text-emerald-500" />
                  ) : (
                    <TrendingDown size={12} className="text-accent" />
                  )}
                  <span className={`text-sm font-black ${item.gapSazonal >= 0 ? 'text-emerald-600' : 'text-accent'}`}>
                    {formatCurrencyBR(item.gapSazonal)}
                  </span>
                </div>
              </div>
            </div>

            <div className={`mt-2 px-3 py-1 rounded-full text-[8px] font-black uppercase text-center tracking-widest ${
              item.status === 'above' ? 'bg-emerald-50 text-emerald-600' :
              item.status === 'warning' ? 'bg-amber-50 text-amber-600' :
              'bg-accent/10 text-accent'
            }`}>
              {item.status === 'above' ? 'Acima do Ritmo' :
               item.status === 'warning' ? 'Atenção: Ritmo Lento' :
               'Crítico: Abaixo do Ritmo'}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
