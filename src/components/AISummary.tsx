
import React, { useState, useEffect } from 'react';
import { OracleData } from '../types/oracle';
import { generateExecutiveAnalysis } from '../services/geminiService';
import Markdown from 'react-markdown';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateTimeBR } from '../utils/formatters';

interface Props {
  data: OracleData;
}

export const AISummary: React.FC<Props> = ({ data }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchAnalysis = async () => {
    setLoading(true);
    const text = await generateExecutiveAnalysis(data);
    setAnalysis(text || "Falha ao gerar análise.");
    setLoading(false);
  };

  useEffect(() => {
    if (data.store.name) {
      fetchAnalysis();
    }
  }, [data.store.name, data.store.healthIndex]);

  return (
    <div className="bg-zinc-900 text-zinc-100 rounded-2xl shadow-xl overflow-hidden border border-white/10">
      <div 
        className="p-6 flex justify-between items-center cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Inteligência Estratégica</h2>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Leitura Executiva • {data.store.period.label}</p>
          </div>
        </div>
        <button className="text-zinc-500 hover:text-white transition-colors">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="animate-spin text-zinc-500" size={32} />
                  <p className="text-sm font-mono text-zinc-500 animate-pulse">PROCESSANDO CENÁRIOS ESTRUTURAIS...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="markdown-body">
                    <Markdown>{analysis || ""}</Markdown>
                  </div>
                </div>
              )}
              
              {!loading && (
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                    <Clock size={10} /> Gerado em: {formatDateTimeBR(data.generatedAt)}
                  </div>
                  <button 
                    onClick={fetchAnalysis}
                    className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                  >
                    Recalcular Análise
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
