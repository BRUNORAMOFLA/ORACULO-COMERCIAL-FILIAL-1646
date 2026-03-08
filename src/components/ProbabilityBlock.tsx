
import React, { useMemo } from 'react';
import { PeriodContext, HistoryRecord } from '../types/oracle';
import { motion } from 'motion/react';
import { Gauge } from 'lucide-react';
import { formatCurrencyBR } from '../utils/formatters';

interface Props {
  context: PeriodContext;
  history: HistoryRecord[];
}

export const ProbabilityBlock: React.FC<Props> = ({ context, history }) => {
  const analysis = useMemo(() => {
    const pillars = ['mercantil', 'cdc', 'services'] as const;
    const diasDecorridos = context.businessDaysElapsed || 0;
    const diasUteisMes = context.businessDaysTotal || 1;
    const diasRestantes = Math.max(0, diasUteisMes - diasDecorridos);

    const calculateRecentMedia = (pillar: 'mercantil' | 'cdc' | 'services') => {
      const validDailyRecords = history
        .filter(r => r.tipo === 'daily' && r.dados.store.pillars[pillar].realized > 0)
        .slice(0, 3);
      
      if (validDailyRecords.length === 0) return 0;
      
      const sum = validDailyRecords.reduce((acc, r) => acc + r.dados.store.pillars[pillar].realized, 0);
      return sum / validDailyRecords.length;
    };

    return pillars.map(p => {
      const metaMensal = context.store[p].metaMensal || context.store[p].meta;
      const realizadoAcumulado = context.store[p].real;
      
      const mediaRecente = calculateRecentMedia(p);
      const projecaoFinal = diasRestantes <= 0 ? realizadoAcumulado : realizadoAcumulado + (mediaRecente * diasRestantes);
      const gapProjetado = Math.max(0, metaMensal - projecaoFinal);
      
      const indiceProbabilidade = realizadoAcumulado >= metaMensal ? 1.1 : (metaMensal > 0 ? projecaoFinal / metaMensal : 0);

      let probabilidadeLabel = "CRÍTICA";
      let probabilidadeScore = 20;
      let colorClass = "text-red-600";
      let bgClass = "bg-red-50";
      let borderClass = "border-red-100";
      let dotColor = "bg-red-500";

      if (realizadoAcumulado >= metaMensal) {
        probabilidadeLabel = "MUITO ALTA";
        probabilidadeScore = 100;
        colorClass = "text-emerald-800";
        bgClass = "bg-emerald-100";
        borderClass = "border-emerald-200";
        dotColor = "bg-emerald-700";
      } else if (indiceProbabilidade >= 1.00) {
        probabilidadeLabel = "MUITO ALTA";
        probabilidadeScore = 95;
        colorClass = "text-emerald-800";
        bgClass = "bg-emerald-100";
        borderClass = "border-emerald-200";
        dotColor = "bg-emerald-700";
      } else if (indiceProbabilidade >= 0.90) {
        probabilidadeLabel = "ALTA";
        probabilidadeScore = 80;
        colorClass = "text-emerald-600";
        bgClass = "bg-emerald-50";
        borderClass = "border-emerald-100";
        dotColor = "bg-emerald-500";
      } else if (indiceProbabilidade >= 0.80) {
        probabilidadeLabel = "MÉDIA";
        probabilidadeScore = 60;
        colorClass = "text-amber-600";
        bgClass = "bg-amber-50";
        borderClass = "border-amber-100";
        dotColor = "bg-amber-500";
      } else if (indiceProbabilidade >= 0.65) {
        probabilidadeLabel = "BAIXA";
        probabilidadeScore = 40;
        colorClass = "text-orange-600";
        bgClass = "bg-orange-50";
        borderClass = "border-orange-100";
        dotColor = "bg-orange-500";
      }

      return {
        id: p,
        label: p === 'services' ? 'Serviços' : p.toUpperCase(),
        probabilidadeLabel,
        probabilidadeScore,
        projecaoFinal,
        gapProjetado,
        colorClass,
        bgClass,
        borderClass,
        dotColor
      };
    });
  }, [context, history]);

  if (context.mode !== 'monthly') return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          <Gauge size={18} />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">
          Probabilidade de Fechamento da Meta
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analysis.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-3xl border ${item.bgClass} ${item.borderClass} shadow-sm space-y-3`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {item.label}
              </span>
              <div className={`w-2 h-2 rounded-full ${item.dotColor} animate-pulse`} />
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black ${item.colorClass}`}>
                  {item.probabilidadeScore}%
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Probabilidade</span>
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${item.colorClass}`}>
                {item.probabilidadeLabel}
              </p>
            </div>

            <div className="pt-3 border-t border-black/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold text-zinc-400 uppercase">Projeção Final</span>
                <span className={`text-xs font-black ${item.colorClass}`}>{formatCurrencyBR(item.projecaoFinal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold text-zinc-400 uppercase">Gap Projetado</span>
                <span className={`text-xs font-bold ${item.gapProjetado <= 0 ? 'text-emerald-600' : 'text-accent'}`}>
                  {item.gapProjetado <= 0 ? 'META SUPERADA' : formatCurrencyBR(item.gapProjetado)}
                </span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${item.probabilidadeScore}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full ${item.dotColor}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
