
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

  const fetchAnalysis = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLoading(true);
    const text = await generateExecutiveAnalysis(data);
    setAnalysis(text || "Falha ao gerar análise.");
    setLoading(false);
    setExpanded(true);
  };

  // Remove automatic fetch on mount or data change
  // useEffect(() => {
  //   if (data.store.name) {
  //     fetchAnalysis();
  //   }
  // }, [data.store.name, data.store.healthIndex]);

  return (
    <div className="bg-primary text-white rounded-2xl shadow-xl overflow-hidden border border-white/10">
      <div 
        className="p-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Sparkles size={20} className={`text-accent ${loading ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Inteligência Estratégica</h2>
            <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Leitura Executiva • {data.store.period.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!analysis && !loading && (
            <button 
              onClick={fetchAnalysis}
              className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
            >
              GERAR LEITURA
            </button>
          )}
          <button className="text-white/50 hover:text-white transition-colors">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
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
              {!analysis && !loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Sparkles size={32} className="text-white/20" />
                  </div>
                  <div className="space-y-2 max-w-xs">
                    <p className="text-sm font-bold text-white/80 uppercase tracking-tight">Análise Pronta para Processamento</p>
                    <p className="text-[10px] text-white/40 font-medium leading-relaxed">Clique no botão para que o Oráculo processe os cenários e gere o diagnóstico estratégico desta unidade.</p>
                  </div>
                  <button 
                    onClick={fetchAnalysis}
                    className="px-8 py-3 bg-white text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
                  >
                    GERAR DIAGNÓSTICO AGORA
                  </button>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="animate-spin text-white/30" size={32} />
                  <p className="text-sm font-mono text-white/50 animate-pulse">PROCESSANDO CENÁRIOS ESTRUTURAIS...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="markdown-body">
                    <Markdown>{analysis || ""}</Markdown>
                  </div>
                </div>
              )}
              
              {analysis && !loading && (
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                  <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest flex items-center gap-1">
                    <Clock size={10} /> Gerado em: {formatDateTimeBR(new Date().toISOString())}
                  </div>
                  <button 
                    onClick={fetchAnalysis}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
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
