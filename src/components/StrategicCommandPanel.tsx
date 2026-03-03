
import React, { useState } from 'react';
import { StrategicContext } from '../types/oracle';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Target, TrendingUp, DollarSign, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { formatCurrencyBR } from '../utils/formatters';

interface Props {
  context: StrategicContext;
}

export const StrategicCommandPanel: React.FC<Props> = ({ context }) => {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
            <Zap size={18} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">
            Comando Estratégico Contextual • {context.mode}
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full">
          <Sparkles size={12} className="text-accent" />
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
            Simulação +10% Volume {context.mode}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {context.impacts.map((impact, idx) => (
          <motion.div
            key={impact.pillar}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
              expandedPillar === impact.pillar ? 'border-primary shadow-xl ring-1 ring-primary/10' : 'border-primary/10 shadow-sm hover:border-primary/30'
            }`}
          >
            <div 
              className="p-6 cursor-pointer"
              onClick={() => setExpandedPillar(expandedPillar === impact.pillar ? null : impact.pillar)}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Pilar Estratégico</span>
                  <h4 className="text-lg font-black text-primary">{impact.pillar}</h4>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  expandedPillar === impact.pillar ? 'bg-primary text-white' : 'bg-zinc-50 text-zinc-400'
                }`}>
                  {expandedPillar === impact.pillar ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-zinc-400 uppercase block">Impacto Marginal</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-500" />
                    <span className="text-sm font-black text-emerald-600">+{impact.marginalScore.toFixed(1)} pts</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-zinc-400 uppercase block">Impacto Coletivo</span>
                  <div className="flex items-center gap-1">
                    <DollarSign size={12} className="text-primary" />
                    <span className="text-sm font-black text-primary">{formatCurrencyBR(impact.collectiveValue)}</span>
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedPillar === impact.pillar && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-zinc-100 bg-zinc-50/50"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Novo Score {context.mode}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-zinc-900">{impact.simulatedScore.toFixed(1)}%</span>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          impact.simulatedScore >= 85 ? 'bg-emerald-100 text-emerald-700' :
                          impact.simulatedScore >= 70 ? 'bg-primary/10 text-primary' :
                          'bg-accent/10 text-accent'
                        }`}>
                          {impact.simulatedClassification}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white rounded-xl border border-zinc-200">
                      <p className="text-[10px] text-zinc-600 leading-relaxed">
                        A aplicação de 10% de volume incremental no pilar <strong className="text-primary">{impact.pillar}</strong> elevaria a saúde da operação para <strong className="text-primary">{impact.simulatedScore.toFixed(1)}%</strong>, gerando um ganho real de <strong className="text-emerald-600">{impact.marginalScore.toFixed(1)} pontos</strong> no Score Global do período.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
