
import React, { useMemo } from 'react';
import { PeriodContext } from '../types/oracle';
import { motion } from 'motion/react';
import { Gauge } from 'lucide-react';

interface Props {
  context: PeriodContext;
}

export const ProbabilityBlock: React.FC<Props> = ({ context }) => {
  const analysis = useMemo(() => {
    const pillars = ['mercantil', 'cdc', 'services'] as const;
    const diasDecorridos = context.businessDaysElapsed || 0;
    const diasUteisMes = context.businessDaysTotal || 1;
    const diasRestantes = Math.max(0, diasUteisMes - diasDecorridos);

    return pillars.map(p => {
      const metaMensal = context.store[p].metaMensal || context.store[p].meta;
      const realizadoAcumulado = context.store[p].real;
      
      const metaRestante = metaMensal - realizadoAcumulado;
      
      let indiceViabilidade = 0;
      if (metaRestante <= 0) {
        indiceViabilidade = 2; // Meta batida
      } else if (diasRestantes <= 0) {
        indiceViabilidade = 0; // Meta não batida e sem dias restantes
      } else if (diasDecorridos <= 0) {
        indiceViabilidade = 1; // Início do mês, assume-se ritmo neutro
      } else {
        const mediaNecessaria = metaRestante / diasRestantes;
        const mediaReal = realizadoAcumulado / diasDecorridos;
        indiceViabilidade = mediaReal / mediaNecessaria;
      }

      let probabilidade = "CRÍTICA";
      let probabilidadeScore = 20;
      let colorClass = "text-red-600";
      let bgClass = "bg-red-50";
      let borderClass = "border-red-100";
      let dotColor = "bg-red-500";

      if (indiceViabilidade >= 1.30) {
        probabilidade = "MUITO ALTA";
        probabilidadeScore = 90;
        colorClass = "text-emerald-800";
        bgClass = "bg-emerald-100";
        borderClass = "border-emerald-200";
        dotColor = "bg-emerald-700";
      } else if (indiceViabilidade >= 1.10) {
        probabilidade = "ALTA";
        probabilidadeScore = 75;
        colorClass = "text-emerald-600";
        bgClass = "bg-emerald-50";
        borderClass = "border-emerald-100";
        dotColor = "bg-emerald-500";
      } else if (indiceViabilidade >= 0.90) {
        probabilidade = "MÉDIA";
        probabilidadeScore = 60;
        colorClass = "text-amber-600";
        bgClass = "bg-amber-50";
        borderClass = "border-amber-100";
        dotColor = "bg-amber-500";
      } else if (indiceViabilidade >= 0.70) {
        probabilidade = "BAIXA";
        probabilidadeScore = 40;
        colorClass = "text-orange-600";
        bgClass = "bg-orange-50";
        borderClass = "border-orange-100";
        dotColor = "bg-orange-500";
      }

      return {
        id: p,
        label: p === 'services' ? 'Serviços' : p.toUpperCase(),
        probabilidade,
        probabilidadeScore,
        colorClass,
        bgClass,
        borderClass,
        dotColor
      };
    });
  }, [context]);

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
                {item.probabilidade}
              </p>
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
