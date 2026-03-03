
import React, { useState, useMemo } from 'react';
import { Seller, Store } from '../types/oracle';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, BarChart3, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { formatCurrencyBR } from '../utils/formatters';

interface Props {
  sellers: Seller[];
  store: Store;
}

export const CollectiveImpactBlock: React.FC<Props> = ({ sellers, store }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const analysis = useMemo(() => {
    const EXCLUDED_SELLER = 'Caio';
    const filteredSellers = sellers.filter(s => s.name?.toLowerCase() !== EXCLUDED_SELLER.toLowerCase());

    return filteredSellers.map(s => {
      const pillars = [
        { name: 'mercantil', realized: s.pillars.mercantil.realized, icm: s.pillars.mercantil.icm },
        { name: 'cdc', realized: s.pillars.cdc.realized, icm: s.pillars.cdc.icm },
        { name: 'services', realized: s.pillars.services.realized, icm: s.pillars.services.icm }
      ];

      // Identify weakest pillar (lowest ICM)
      const weakest = [...pillars].sort((a, b) => a.icm - b.icm)[0];
      
      // Impact = 10% of REAL value sold in that pillar
      const impactValue = weakest.realized * 0.1;
      
      // Store total for that pillar in the current period
      const storePillar = store.pillars[weakest.name as 'mercantil' | 'cdc' | 'services'];
      const storeTotal = storePillar.realized;
      
      // % Impact on store result
      const storeImpactPercent = storeTotal > 0 ? (impactValue / storeTotal) * 100 : 0;

      return {
        ...s,
        weakestPillar: weakest.name,
        impactValue,
        storeImpactPercent
      };
    }).sort((a, b) => b.impactValue - a.impactValue);
  }, [sellers, store]);

  return (
    <div className="mt-4 border-t border-zinc-100 pt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
      >
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {isExpanded ? 'Fechar Impacto Coletivo' : 'Mostrar Impacto Coletivo Potencial'}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {analysis.map((s, idx) => (
                <div key={s.id} className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:border-primary/20 transition-all space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <h4 className="text-xs font-black text-primary">{s.name}</h4>
                    </div>
                    <div className="px-2 py-0.5 bg-primary/5 rounded text-[8px] font-black text-primary uppercase">
                      {s.weakestPillar}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase block">Alavanca Financeira (+10%)</span>
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} className="text-emerald-500" />
                          <span className="text-sm font-black text-emerald-600">{formatCurrencyBR(s.impactValue)}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase block">Impacto na Loja</span>
                        <div className="flex items-center justify-end gap-1">
                          <TrendingUp size={10} className="text-primary" />
                          <span className="text-xs font-black text-primary">+{s.storeImpactPercent.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, s.storeImpactPercent * 10)}%` }}
                        className="h-full bg-emerald-500"
                      />
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
