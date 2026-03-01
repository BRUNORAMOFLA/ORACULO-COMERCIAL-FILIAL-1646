
import React, { useState, useMemo } from 'react';
import { OracleHistory, OracleResult } from '../../types/oracle';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, History, BarChart2, ArrowLeftRight } from 'lucide-react';
import { CompareMode } from './CompareMode';
import { HistoryMode } from './HistoryMode';

interface Props {
  history: OracleHistory;
  currentData: OracleResult;
  periodMode: 'DIARIO' | 'SEMANAL' | 'MENSAL';
  onPeriodModeChange: (mode: 'DIARIO' | 'SEMANAL' | 'MENSAL') => void;
}

export const EvolutionTab: React.FC<Props> = ({ history, currentData, periodMode, onPeriodModeChange }) => {
  const [mode, setMode] = useState<'compare' | 'history'>('compare');

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-zinc-900" />
            <h2 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Evolução Estratégica</h2>
          </div>
          
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            {[
              { label: 'Diário', mode: 'DIARIO' as const },
              { label: 'Semanal', mode: 'SEMANAL' as const },
              { label: 'Mensal', mode: 'MENSAL' as const }
            ].map((p) => (
              <button
                key={p.mode}
                onClick={() => onPeriodModeChange(p.mode)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  periodMode === p.mode ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex bg-zinc-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setMode('compare')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'compare' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'
            }`}
          >
            <ArrowLeftRight size={14} /> COMPARATIVO
          </button>
          <button
            onClick={() => setMode('history')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'history' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'
            }`}
          >
            <History size={14} /> HISTÓRICO GLOBAL
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'compare' ? (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CompareMode history={history} currentData={currentData} />
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <HistoryMode history={history} currentData={currentData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
