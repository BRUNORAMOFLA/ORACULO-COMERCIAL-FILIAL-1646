
import React from 'react';
import { Seller } from '../types/oracle';
import { motion } from 'motion/react';
import { Users, AlertTriangle } from 'lucide-react';

interface Props {
  sellers: Seller[];
}

export const TeamDispersionBlock: React.FC<Props> = ({ sellers }) => {
  const below80Count = sellers.filter(s => s.score < 80).length;
  
  const getStatusColor = (score: number) => {
    if (score >= 100) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (score >= 80) return 'text-amber-500 bg-amber-50 border-amber-100';
    return 'text-accent bg-accent/5 border-accent/10';
  };

  const getDotColor = (score: number) => {
    if (score >= 100) return 'bg-emerald-500';
    if (score >= 80) return 'bg-amber-500';
    return 'bg-accent';
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Users size={18} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">
            Dispersão do Time
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full">
          <AlertTriangle size={12} className="text-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">
            {below80Count} Vendedores abaixo de 80%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sellers.sort((a, b) => a.score - b.score).map((seller, idx) => (
          <motion.div
            key={seller.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-3 rounded-2xl border flex items-center justify-between ${getStatusColor(seller.score)}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${getDotColor(seller.score)} animate-pulse`} />
              <span className="text-xs font-bold truncate max-w-[120px]">{seller.name}</span>
            </div>
            <span className="text-sm font-black">{seller.score.toFixed(1)}%</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
