
import React, { useState, useMemo } from 'react';
import { Seller, Store } from '../types/oracle';
import { motion, AnimatePresence } from 'motion/react';
import { Target, TrendingUp, AlertCircle, ShieldCheck, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { calculateHealthIndex } from '../calculations/formulas';

interface Props {
  sellers: Seller[];
  store: Store;
}

export const StrategicPriorityBlock: React.FC<Props> = ({ sellers, store }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const analysis = useMemo(() => {
    return sellers.map(s => {
      const icms = [
        { name: 'mercantil', value: s.pillars.mercantil.icm },
        { name: 'cdc', value: s.pillars.cdc.icm },
        { name: 'services', value: s.pillars.services.icm }
      ];

      // Find weakest pillar
      const weakest = [...icms].sort((a, b) => a.value - b.value)[0];
      
      // Simulate +10 points in weakest pillar
      const simulatedIcms = {
        mercantil: s.pillars.mercantil.icm,
        cdc: s.pillars.cdc.icm,
        services: s.pillars.services.icm,
        [weakest.name]: s.pillars[weakest.name as keyof typeof s.pillars].icm + 10
      };

      const newScore = calculateHealthIndex(
        simulatedIcms.mercantil,
        simulatedIcms.cdc,
        simulatedIcms.services
      );

      const marginalImpact = newScore - s.score;

      // IP Calculation
      let ip = marginalImpact;
      let type = 'Estável';
      let justification = '';
      let action = '';

      if (s.score < 40) {
        ip += 20;
        type = 'Correção';
        justification = 'Performance crítica global compromete a tração do time.';
        action = 'Reciclagem técnica e acompanhamento diário de funil.';
      } else if (icms.some(v => v.value < 40)) {
        ip += 15;
        type = 'Blindagem';
        justification = 'Grave lacuna em um pilar específico gera vulnerabilidade.';
        action = 'Focar exclusivamente no pilar deficitário nas próximas 48h.';
      } else if (s.score >= 100 && icms.some(v => v.value < 60)) {
        ip += 10;
        type = 'Ganho Rápido';
        justification = 'Vendedor de alto volume com desequilíbrio técnico evitável.';
        action = 'Ajuste fino de abordagem para cross-selling.';
      } else {
        justification = 'Performance equilibrada com margem de crescimento linear.';
        action = 'Manter ritmo e buscar superação nos pilares secundários.';
      }

      return {
        ...s,
        marginalImpact,
        ip,
        type,
        justification,
        action,
        weakestPillar: weakest.name
      };
    }).sort((a, b) => b.ip - a.ip);
  }, [sellers]);

  return (
    <div className="mt-6 border-t border-zinc-100 pt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
      >
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {isExpanded ? 'Fechar Análise' : 'Mostrar Prioridade Estratégica'}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {analysis.map((s, idx) => (
                <div key={s.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-400">#{idx + 1}</span>
                      <h4 className="text-sm font-black text-primary">{s.name}</h4>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                      s.type === 'Correção' ? 'bg-red-50 text-red-600 border-red-100' :
                      s.type === 'Blindagem' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      s.type === 'Ganho Rápido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-zinc-100 text-zinc-500 border-zinc-200'
                    }`}>
                      {s.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase block">Impacto no Score</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={10} className="text-emerald-500" />
                        <span className="text-xs font-black text-emerald-600">+{s.marginalImpact.toFixed(1)} pts</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase block">Pilar Alvo</span>
                      <span className="text-xs font-black text-primary uppercase">{s.weakestPillar}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-200">
                    <div>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase block">Justificativa</span>
                      <p className="text-[10px] text-zinc-600 leading-tight">{s.justification}</p>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-zinc-100">
                      <Sparkles size={12} className="text-accent mt-0.5" />
                      <div>
                        <span className="text-[8px] font-black text-accent uppercase block">Ação Sugerida</span>
                        <p className="text-[10px] font-bold text-zinc-900 leading-tight">{s.action}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
