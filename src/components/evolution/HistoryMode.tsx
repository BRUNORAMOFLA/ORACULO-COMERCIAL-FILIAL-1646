
import React, { useMemo, useState } from 'react';
import { OracleHistory, OracleResult } from '../../types/oracle';
import { HistoryPoint } from '../../types/intelligence';
import { 
  calcPeriodScoreStore, 
  calcTrend, 
  formatBRL, 
  formatPercentBR,
  calcICM
} from '../../lib/intelligence/score';
import { generatePeriodLabel } from '../../utils/formatters';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, Users, ShieldAlert, Sparkles, Loader2, Info } from 'lucide-react';
import { generateHistoryAnalysis } from '../../services/gemini';
import { METRIC_DEFINITIONS } from '../../constants/metrics';

interface Props {
  history: OracleHistory;
  currentData: OracleResult;
  periodMode: 'DIARIO' | 'SEMANAL' | 'MENSAL';
}

interface HistoryAnalysis {
  classificacao_ciclo: string;
  nivel_alerta: 'critico' | 'atencao' | 'saudavel';
  score_atual: number;
  dependencia_atual: number;
  indice_risco_estrutural: number;
  indice_consistencia: number;
  projecao_proximo_ciclo: number;
  interno: {
    status_ciclo: string;
    tendencia_score: string;
    raio_x_pilares: string;
    evolucao_dependencia: string;
    maturidade_operacional: string;
    conclusao_estrategica: string;
    frase_final: string;
  };
  executivo: {
    situacao: string;
    causa_principal: string;
    risco: string;
    acao_imediata: string;
    frase_final: string;
  };
}

export const HistoryMode: React.FC<Props> = ({ history, currentData, periodMode }) => {
  const [analysis, setAnalysis] = useState<HistoryAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'interno' | 'executivo'>('interno');
  const [indicator, setIndicator] = useState<'score' | 'mercantil' | 'cdc' | 'services'>('score');

  const historyPoints: HistoryPoint[] = useMemo(() => {
    // 1. Sort history by date to ensure chronological order in charts
    const sortedRecords = [...history.registros].sort((a, b) => {
      const pa = a.dados.store.period;
      const pb = b.dados.store.period;
      
      // Create comparable date strings
      const dateA = pa.startDate || pa.date || `${pa.year}-${String(pa.month).padStart(2, '0')}-01`;
      const dateB = pb.startDate || pb.date || `${pb.year}-${String(pb.month).padStart(2, '0')}-01`;
      
      return dateA.localeCompare(dateB);
    });

    const points: HistoryPoint[] = sortedRecords.map(r => {
      const store = r.dados.store;
      const sellers = r.dados.sellers;
      const mercantilReal = store.pillars.mercantil.realized;
      const mercantilMeta = store.pillars.mercantil.meta;
      
      const sortedSellers = [...sellers].sort((a, b) => b.pillars.mercantil.realized - a.pillars.mercantil.realized);
      const top2 = (sortedSellers[0]?.pillars.mercantil.realized || 0) + (sortedSellers[1]?.pillars.mercantil.realized || 0);
      const dependency = (top2 / Math.max(mercantilReal, 1)) * 100;

      const label = generatePeriodLabel(store.period);

      return {
        periodId: r.id,
        label,
        score: calcPeriodScoreStore(store, sellers),
        mercantilReal,
        mercantilMeta,
        cdcReal: store.pillars.cdc.realized,
        cdcMeta: store.pillars.cdc.meta,
        servicesReal: store.pillars.services.realized,
        servicesMeta: store.pillars.services.meta,
        dependency,
        mercantilICM: calcICM(mercantilReal, mercantilMeta),
        cdcICM: calcICM(store.pillars.cdc.realized, store.pillars.cdc.meta),
        servicesICM: calcICM(store.pillars.services.realized, store.pillars.services.meta)
      };
    });
    
    // Add current data if not redundant
    const currentStore = currentData.store;
    const currentPeriod = currentStore.period;
    
    const isRedundant = sortedRecords.some(r => {
      const p = r.dados.store.period;
      if (p.type !== currentPeriod.type) return false;
      if (p.type === 'monthly') return p.month === currentPeriod.month && p.year === currentPeriod.year;
      if (p.type === 'weekly') return p.startDate === currentPeriod.startDate && p.endDate === currentPeriod.endDate;
      if (p.type === 'daily') return p.date === currentPeriod.date;
      return false;
    });

    if (!isRedundant) {
      const currentSellers = currentData.sellers;
      const currentMercantilReal = currentStore.pillars.mercantil.realized;
      const currentSortedSellers = [...currentSellers].sort((a, b) => b.pillars.mercantil.realized - a.pillars.mercantil.realized);
      const currentTop2 = (currentSortedSellers[0]?.pillars.mercantil.realized || 0) + (currentSortedSellers[1]?.pillars.mercantil.realized || 0);
      const currentDependency = (currentTop2 / Math.max(currentMercantilReal, 1)) * 100;

      const label = generatePeriodLabel(currentPeriod);

      points.push({
        periodId: 'current',
        label,
        score: calcPeriodScoreStore(currentStore, currentSellers),
        mercantilReal: currentMercantilReal,
        mercantilMeta: currentStore.pillars.mercantil.meta,
        cdcReal: currentStore.pillars.cdc.realized,
        cdcMeta: currentStore.pillars.cdc.meta,
        servicesReal: currentStore.pillars.services.realized,
        servicesMeta: currentStore.pillars.services.meta,
        dependency: currentDependency,
        mercantilICM: calcICM(currentMercantilReal, currentStore.pillars.mercantil.meta),
        cdcICM: calcICM(currentStore.pillars.cdc.realized, currentStore.pillars.cdc.meta),
        servicesICM: calcICM(currentStore.pillars.services.realized, currentStore.pillars.services.meta)
      });
    }

    return points;
  }, [history, currentData, periodMode]);

  const trend = useMemo(() => {
    const values = historyPoints.map(p => {
      if (indicator === 'score') return p.score;
      if (indicator === 'mercantil') return p.mercantilICM || 0;
      if (indicator === 'cdc') return p.cdcICM || 0;
      return p.servicesICM || 0;
    });
    return calcTrend(values);
  }, [historyPoints, indicator]);

  const handleGenerateAnalysis = async () => {
    setIsGenerating(true);
    try {
      const scores = historyPoints.map(p => p.score);
      const dependencies = historyPoints.map(p => p.dependency);
      
      const avgMercICM = historyPoints.reduce((acc, p) => acc + (p.mercantilICM || 0), 0) / historyPoints.length;
      const avgCDCICM = historyPoints.reduce((acc, p) => acc + (p.cdcICM || 0), 0) / historyPoints.length;
      const avgServICM = historyPoints.reduce((acc, p) => acc + (p.servicesICM || 0), 0) / historyPoints.length;
      
      const depTrend = calcTrend(dependencies);

      const prompt = `
Analise o histórico global da unidade (${historyPoints.length} ciclos):
- Tendência de Score: ${trend}
- Tendência de Dependência: ${depTrend}
- Médias Históricas (ICM): Mercantil ${avgMercICM.toFixed(1)}%, CDC ${avgCDCICM.toFixed(1)}%, Services ${avgServICM.toFixed(1)}%
- Lista de Ciclos (Score / Dependência):
${historyPoints.map(p => `- ${p.label}: Score ${p.score.toFixed(1)} / Dep ${p.dependency.toFixed(1)}%`).join('\n')}

Gere as análises Interna e Executiva conforme as regras de blocos obrigatórios. Retorne apenas o JSON.
`;
      const result = await generateHistoryAnalysis(prompt);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Indicator Selector */}
      <div className="flex bg-zinc-100 p-1 rounded-xl w-fit">
        {[
          { id: 'score', label: 'Score Global' },
          { id: 'mercantil', label: 'Mercantil' },
          { id: 'cdc', label: 'CDC' },
          { id: 'services', label: 'Serviços' }
        ].map((i) => (
          <button
            key={i.id}
            onClick={() => setIndicator(i.id as any)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${indicator === i.id ? 'bg-white shadow-sm text-primary' : 'text-zinc-500'}`}
          >
            {i.label}
          </button>
        ))}
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            trend === 'Tendência de Alta' ? 'bg-emerald-50 text-emerald-600' : 
            trend === 'Tendência de Queda' ? 'bg-accent/10 text-accent' : 'bg-zinc-50 text-zinc-600'
          }`}>
            {trend === 'Tendência de Alta' ? <TrendingUp size={24} /> : 
             trend === 'Tendência de Queda' ? <TrendingDown size={24} /> : <Activity size={24} />}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Tendência {indicator === 'score' ? 'Global' : indicator.toUpperCase()}</span>
            <span className="text-lg font-black text-primary">{trend}</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Média de {indicator === 'score' ? 'Score' : 'ICM'}</span>
            <span className="text-lg font-black text-primary">
              {(historyPoints.reduce((acc, p) => {
                if (indicator === 'score') return acc + p.score;
                if (indicator === 'mercantil') return acc + (p.mercantilICM || 0);
                if (indicator === 'cdc') return acc + (p.cdcICM || 0);
                return acc + (p.servicesICM || 0);
              }, 0) / historyPoints.length).toFixed(1)} {indicator === 'score' ? 'pts' : '%'}
            </span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-primary/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Dependência Média</span>
            <span className="text-lg font-black text-primary">
              {(historyPoints.reduce((acc, p) => acc + p.dependency, 0) / historyPoints.length).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Score/ICM Evolution Chart */}
      <div className="p-8 bg-white rounded-[2rem] border border-black/5 shadow-sm space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
          Evolução {indicator === 'score' ? 'do Score da Unidade' : `do ICM ${indicator.toUpperCase()}`}
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyPoints}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Line 
                type="monotone" 
                dataKey={indicator === 'score' ? 'score' : `${indicator}ICM`} 
                name={indicator === 'score' ? 'Score Final' : `ICM ${indicator.toUpperCase()}`} 
                stroke="#0047BA" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#0047BA', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pillars Comparison Chart */}
      <div className="p-8 bg-white rounded-[2rem] border border-black/5 shadow-sm space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
          {indicator === 'score' ? 'Performance dos Pilares (ICM %)' : `Performance ${indicator.toUpperCase()} (Real vs Meta)`}
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyPoints}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                formatter={(value: any) => indicator === 'score' ? `${Number(value).toFixed(1)}%` : formatBRL(Number(value))}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              {indicator === 'score' ? (
                <>
                  <Bar dataKey="mercantilICM" name="Mercantil (%)" fill="#0047BA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cdcICM" name="CDC (%)" fill="#E31C1C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="servicesICM" name="Serviços (%)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <>
                  <Bar dataKey={`${indicator}Real`} name={`${indicator.toUpperCase()} Real`} fill="#0047BA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={`${indicator}Meta`} name={`${indicator.toUpperCase()} Meta`} fill="#E31C1C" radius={[4, 4, 0, 0]} opacity={0.2} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dependency Chart */}
      <div className="p-8 bg-white rounded-[2rem] border border-black/5 shadow-sm space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Índice de Dependência (Top 2 Share)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyPoints}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Line 
                type="monotone" 
                dataKey="dependency" 
                name="Dependência (%)" 
                stroke="#E31C1C" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#E31C1C' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Global History Analysis Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Análise Consolidada do Histórico</h3>
          </div>
        </div>

        {!analysis && !isGenerating && (
          <div className="p-12 bg-primary rounded-[2rem] text-center space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={32} className="text-accent" />
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-bold">Gerar Leitura Estratégica Global</h4>
              <p className="text-white/60 text-sm max-w-md mx-auto">O Oráculo analisará todos os ciclos salvos para identificar padrões de maturidade e riscos estruturais de longo prazo.</p>
            </div>
            <button
              onClick={handleGenerateAnalysis}
              className="px-8 py-4 bg-white text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center gap-2 mx-auto shadow-xl shadow-white/5"
            >
              <Sparkles size={16} className="text-accent" /> INICIAR ANÁLISE IA
            </button>
          </div>
        )}

        {isGenerating ? (
          <div className="p-12 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 size={32} className="text-zinc-400 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-900">Processando histórico global...</p>
              <p className="text-xs text-zinc-500">Cruzando dados de {historyPoints.length} ciclos operacionais.</p>
            </div>
          </div>
        ) : analysis ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('interno')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'interno' ? 'bg-white shadow-sm text-primary' : 'text-zinc-500'}`}
              >
                Análise Interna
              </button>
              <button
                onClick={() => setActiveTab('executivo')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'executivo' ? 'bg-white shadow-sm text-primary' : 'text-zinc-500'}`}
              >
                Análise Executiva
              </button>
            </div>

            <div className="p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Activity size={120} className="text-primary" />
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  analysis.nivel_alerta === 'critico' ? 'bg-accent/10 text-accent' :
                  analysis.nivel_alerta === 'atencao' ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {analysis.classificacao_ciclo} • {analysis.nivel_alerta}
                </div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Score: {analysis.score_atual.toFixed(1)} • Dep: {analysis.dependencia_atual.toFixed(1)}%
                </div>
              </div>

              {/* Advanced Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-white rounded-2xl border border-zinc-100 flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Risco Estrutural</span>
                  <div className="flex items-end gap-2 mb-2">
                    <span className={`text-xl font-black ${analysis.indice_risco_estrutural > 50 ? 'text-accent' : 'text-primary'}`}>
                      {analysis.indice_risco_estrutural}%
                    </span>
                    <div className="flex-1 h-1 bg-zinc-100 rounded-full mb-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${analysis.indice_risco_estrutural > 50 ? 'bg-accent' : 'bg-primary'}`}
                        style={{ width: `${analysis.indice_risco_estrutural}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-tight mt-auto italic">
                    {METRIC_DEFINITIONS.risco_estrutural}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-zinc-100 flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Consistência</span>
                  <div className="flex items-end gap-2 mb-2">
                    <span className={`text-xl font-black ${analysis.indice_consistencia < 60 ? 'text-amber-600' : 'text-primary'}`}>
                      {analysis.indice_consistencia}%
                    </span>
                    <div className="flex-1 h-1 bg-zinc-100 rounded-full mb-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${analysis.indice_consistencia < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${analysis.indice_consistencia}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-tight mt-auto italic">
                    {METRIC_DEFINITIONS.consistencia}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-zinc-100 flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Projeção Próximo Ciclo</span>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-black text-primary">{analysis.projecao_proximo_ciclo.toFixed(1)}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">pts</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-tight mt-auto italic">
                    {METRIC_DEFINITIONS.projecao_proximo_ciclo}
                  </p>
                </div>
              </div>

              <div className="prose prose-sm prose-zinc max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-[10px] prose-headings:text-zinc-400 prose-p:text-zinc-700 prose-p:font-medium prose-p:leading-relaxed prose-strong:text-primary prose-ul:text-zinc-700">
                {activeTab === 'interno' ? (
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Status Histórico do Ciclo</h4>
                      <p>{analysis.interno.status_ciclo}</p>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Análise da Tendência de Score</h4>
                      <p>{analysis.interno.tendencia_score}</p>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Raio-X dos Pilares</h4>
                      <p>{analysis.interno.raio_x_pilares}</p>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Evolução da Dependência</h4>
                      <p>{analysis.interno.evolucao_dependencia}</p>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Maturidade Operacional</h4>
                      <p>{analysis.interno.maturidade_operacional}</p>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Conclusão Estratégica</h4>
                      <p>{analysis.interno.conclusao_estrategica}</p>
                    </section>
                    <p className="text-primary font-black italic border-l-2 border-primary pl-4 mt-8">
                      {analysis.interno.frase_final}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Situação Atual</h4>
                      <p>{analysis.executivo.situacao}</p>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Causa Principal</h4>
                      <p>{analysis.executivo.causa_principal}</p>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Risco Estratégico</h4>
                      <p>{analysis.executivo.risco}</p>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Ação Imediata</h4>
                      <p>{analysis.executivo.acao_imediata}</p>
                    </section>
                    <p className="text-primary font-black italic border-l-2 border-primary pl-4 mt-8">
                      {analysis.executivo.frase_final}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Info size={12} className="text-zinc-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                    Análise de Histórico • Modo {activeTab === 'interno' ? 'Interno' : 'Executivo'}
                  </span>
                </div>
                <button
                  onClick={handleGenerateAnalysis}
                  className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  REGERAR ANÁLISE
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};
