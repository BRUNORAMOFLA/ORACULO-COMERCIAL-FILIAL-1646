
import React, { useState, useMemo } from 'react';
import { OracleHistory, OracleResult, HistoryRecord } from '../../types/oracle';
import { ComparisonResult, PillarComparison, SellerComparison, EvolutionAlert } from '../../types/intelligence';
import { 
  calcICM, 
  calcPeriodScoreStore, 
  calcPeriodScoreSeller, 
  formatBRL, 
  formatPercentBR 
} from '../../lib/intelligence/score';
import { generatePeriodLabel } from '../../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { AlertsPanel } from './AlertsPanel';
import { ExportButtons } from './ExportButtons';
import { generateStrategicDiagnosis } from '../../services/gemini';
import ReactMarkdown from 'react-markdown';

interface Props {
  history: OracleHistory;
  currentData: OracleResult;
  periodMode: 'DIARIO' | 'SEMANAL' | 'MENSAL';
}

export const CompareMode: React.FC<Props> = ({ history, currentData, periodMode }) => {
  const [periodAId, setPeriodAId] = useState<string>('');
  const [periodBId, setPeriodBId] = useState<string>('current');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [isGeneratingDiagnosis, setIsGeneratingDiagnosis] = useState(false);
  const [focus, setFocus] = useState<'score' | 'mercantil' | 'cdc' | 'services'>('score');

  const records = useMemo(() => {
    const sorted = [...history.registros];
    return sorted;
  }, [history]);

  const generateComparison = () => {
    const recordA = records.find(r => r.id === periodAId);
    const dataA = recordA?.dados;
    const dataB = periodBId === 'current' ? currentData : records.find(r => r.id === periodBId)?.dados;

    if (!dataA || !dataB) return;

    const pillars = ['mercantil', 'cdc', 'services'];
    const pillarComparisons: PillarComparison[] = pillars.map(p => {
      const pKey = p as 'mercantil' | 'cdc' | 'services';
      const baseReal = dataA.store.pillars[pKey].realized;
      const currentReal = dataB.store.pillars[pKey].realized;
      const deltaValue = currentReal - baseReal;
      const deltaPercent = baseReal > 0 ? (deltaValue / baseReal) * 100 : 0;
      const baseICM = calcICM(baseReal, dataA.store.pillars[pKey].meta);
      const currentICM = calcICM(currentReal, dataB.store.pillars[pKey].meta);

      return {
        name: p.charAt(0).toUpperCase() + p.slice(1),
        baseReal,
        currentReal,
        deltaValue,
        deltaPercent,
        baseICM,
        currentICM
      };
    });

    const baseScore = calcPeriodScoreStore(dataA.store, dataA.sellers);
    const currentScore = calcPeriodScoreStore(dataB.store, dataB.sellers);
    const deltaScore = currentScore - baseScore;
    
    let classification: 'Evolução' | 'Estável' | 'Regressão' = 'Estável';
    if (deltaScore >= 3) classification = 'Evolução';
    else if (deltaScore <= -3) classification = 'Regressão';

    // Seller Comparison
    const sellerComparisons: SellerComparison[] = dataB.sellers.map(sB => {
      const sA = dataA.sellers.find(s => s.name === sB.name);
      const bScore = sA ? calcPeriodScoreSeller(sA) : 0;
      const cScore = calcPeriodScoreSeller(sB);
      
      const sortedA = [...dataA.sellers].sort((a, b) => b.pillars.mercantil.realized - a.pillars.mercantil.realized);
      const sortedB = [...dataB.sellers].sort((a, b) => b.pillars.mercantil.realized - a.pillars.mercantil.realized);
      
      const bRank = sortedA.findIndex(s => s.name === sB.name) + 1;
      const cRank = sortedB.findIndex(s => s.name === sB.name) + 1;

      const alerts: string[] = [];
      if (sA) {
        const varPct = (sB.pillars.mercantil.realized - sA.pillars.mercantil.realized) / Math.max(sA.pillars.mercantil.realized, 1);
        if (varPct <= -0.05) alerts.push('Regressão > 5% no Mercantil');
        if (cRank - bRank >= 2) alerts.push('Queda de ranking >= 2 posições');
      }

      const sellerPillars: { [key: string]: any } = {};
      pillars.forEach(p => {
        const pk = p as 'mercantil' | 'cdc' | 'services';
        const bVal = sA ? sA.pillars[pk].realized : 0;
        const cVal = sB.pillars[pk].realized;
        const bMeta = sA ? sA.pillars[pk].meta : 0;
        const cMeta = sB.pillars[pk].meta;
        
        sellerPillars[pk] = {
          base: bVal,
          current: cVal,
          delta: cVal - bVal,
          baseICM: calcICM(bVal, bMeta),
          currentICM: calcICM(cVal, cMeta)
        };
      });

      return {
        id: sB.id,
        name: sB.name,
        baseScore: bScore,
        currentScore: cScore,
        deltaScore: cScore - bScore,
        baseRank: bRank || 0,
        currentRank: cRank,
        deltaRank: bRank ? bRank - cRank : 0,
        alerts,
        pillars: sellerPillars
      };
    });

    // Alerts
    const alerts: EvolutionAlert[] = [];
    pillarComparisons.forEach(p => {
      if (p.deltaPercent <= -5) {
        let action = "";
        if (p.name === 'CDC') action = "Ação: reforçar CDC na apresentação, com meta diária de ativação por 7 dias e checagem no fechamento.";
        else if (p.name === 'Services') action = "Ação: padronizar anexação de serviços no fechamento e rodar rotina diária por 7 dias.";
        else action = "Ação: atacar conversão e mix, com plano de recuperação de perdas e foco em giro por 7 dias.";
        
        alerts.push({
          type: 'A',
          title: `Regressão no pilar ${p.name}`,
          reason: `O pilar ${p.name} apresentou queda de ${formatPercentBR(Math.abs(p.deltaPercent))} em relação ao período anterior.`,
          action
        });
      }
    });

    const topSellersB = [...dataB.sellers].sort((a, b) => b.pillars.mercantil.realized - a.pillars.mercantil.realized);
    const top2B = (topSellersB[0]?.pillars.mercantil.realized || 0) + (topSellersB[1]?.pillars.mercantil.realized || 0);
    const top2ShareB = top2B / Math.max(dataB.store.pillars.mercantil.realized, 1);

    if (top2ShareB > 0.30) {
      alerts.push({
        type: 'C',
        title: top2ShareB > 0.50 ? 'Risco Alto de Dependência' : 'Atenção: Concentração de Resultado',
        reason: `Os 2 maiores vendedores concentram ${formatPercentBR(top2ShareB * 100)} do faturamento mercantil.`,
        action: top2ShareB > 0.50 
          ? "Ação: plano de redistribuição imediato: foco no terço médio + rotina diária de metas por pilar para reduzir dependência."
          : "Ação: elevar 2 vendedores intermediários ao nível de sustentação em 7 dias (meta +10 pts de ICM), com roteiro e acompanhamento."
      });
    }

    const summary = `A unidade apresenta um quadro de ${classification.toLowerCase()} estratégica. O Score Final saiu de ${baseScore.toFixed(1)} para ${currentScore.toFixed(1)}. ${
      deltaScore >= 0 ? 'Houve um ganho de eficiência operacional' : 'Houve uma perda de tração nos pilares'
    } que impactou o resultado global. É necessário focar nas ações corretivas listadas abaixo para estabilizar a operação.`;

    setComparison({
      periodA: recordA?.id || '',
      periodB: periodBId,
      store: {
        pillars: pillarComparisons,
        baseScore,
        currentScore,
        deltaScore,
        classification,
        top2Share: top2ShareB
      },
      sellers: sellerComparisons,
      alerts,
      executiveSummary: summary
    });

    setDiagnosis(null);
  };

  const handleGenerateDiagnosis = async () => {
    if (!comparison) return;

    setIsGeneratingDiagnosis(true);
    try {
      const merc = comparison.store.pillars.find(p => p.name === 'Mercantil')!;
      const cdc = comparison.store.pillars.find(p => p.name === 'Cdc') || comparison.store.pillars.find(p => p.name === 'CDC')!;
      const serv = comparison.store.pillars.find(p => p.name === 'Services') || comparison.store.pillars.find(p => p.name === 'Serviços')!;

      const prompt = `
Analise os seguintes dados da unidade:
- Crescimento Mercantil: ${formatPercentBR(merc.deltaPercent)}
- Crescimento CDC: ${formatPercentBR(cdc.deltaPercent)}
- Crescimento Services: ${formatPercentBR(serv.deltaPercent)}
- ICM Mercantil: Base ${merc.baseICM.toFixed(1)}% / Atual ${merc.currentICM.toFixed(1)}%
- ICM CDC: Base ${cdc.baseICM.toFixed(1)}% / Atual ${cdc.currentICM.toFixed(1)}%
- ICM Services: Base ${serv.baseICM.toFixed(1)}% / Atual ${serv.currentICM.toFixed(1)}%
- Índice de Dependência (Top 2 Share): ${formatPercentBR(comparison.store.top2Share * 100)}
- Variação Score Global: ${comparison.store.deltaScore.toFixed(1)} pts
- Movimentação de Ranking: ${comparison.sellers.map(s => `${s.name}: ${s.deltaRank > 0 ? '+' : ''}${s.deltaRank}`).join(', ')}

Gere o diagnóstico estratégico conforme as regras de 6 blocos obrigatórios.
`;
      const result = await generateStrategicDiagnosis(prompt);
      setDiagnosis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingDiagnosis(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-white rounded-3xl border border-black/5 shadow-sm space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Configurar Comparativo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-zinc-500">Período Base (A)</label>
            <select 
              value={periodAId}
              onChange={(e) => setPeriodAId(e.target.value)}
              className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-900/5"
            >
              <option value="">Selecione...</option>
              {records.map(r => {
                const label = generatePeriodLabel(r.dados.store.period);
                return (
                  <option key={r.id} value={r.id}>{label}</option>
                );
              })}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-zinc-500">Período Atual (B)</label>
            <select 
              value={periodBId}
              onChange={(e) => setPeriodBId(e.target.value)}
              className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold text-zinc-900 outline-none focus:ring-2 ring-zinc-900/5"
            >
              <option value="current">Dados Atuais (Em edição)</option>
              {records.map(r => {
                const label = generatePeriodLabel(r.dados.store.period);
                return (
                  <option key={r.id} value={r.id}>{label}</option>
                );
              })}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={generateComparison}
              disabled={!periodAId}
              className="w-full p-3 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              GERAR COMPARATIVO
            </button>
          </div>
        </div>
      </div>

      {comparison && (
        <div className="space-y-8" id="evolution-report">
          {/* Executive Header */}
          <div className="p-8 bg-zinc-900 rounded-[2rem] text-white space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status Evolutivo</span>
                <h2 className="text-3xl font-black flex items-center gap-3">
                  {comparison.store.classification}
                  {comparison.store.classification === 'Evolução' ? <TrendingUp className="text-emerald-400" /> : 
                   comparison.store.classification === 'Regressão' ? <TrendingDown className="text-red-400" /> : <Minus className="text-zinc-400" />}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Variação de Score</span>
                <p className={`text-2xl font-black ${comparison.store.deltaScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {comparison.store.deltaScore >= 0 ? '+' : ''}{comparison.store.deltaScore.toFixed(1)} pts
                </p>
              </div>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
              {comparison.executiveSummary}
            </p>
          </div>

          {/* Pillar Table */}
          <div className="p-6 bg-white rounded-3xl border border-black/5 shadow-sm overflow-x-auto">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">Performance por Pilar</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-zinc-400 border-b">
                  <th className="pb-3 px-2">Pilar</th>
                  <th className="pb-3 px-2">Base (A)</th>
                  <th className="pb-3 px-2">Atual (B)</th>
                  <th className="pb-3 px-2">Variação R$</th>
                  <th className="pb-3 px-2">Variação %</th>
                  <th className="pb-3 px-2">ICM A/B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {comparison.store.pillars.map((p, idx) => (
                  <tr key={idx} className="text-sm font-bold text-zinc-900">
                    <td className="py-4 px-2">{p.name}</td>
                    <td className="py-4 px-2 text-zinc-500">{formatBRL(p.baseReal)}</td>
                    <td className="py-4 px-2">{formatBRL(p.currentReal)}</td>
                    <td className={`py-4 px-2 ${p.deltaValue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {p.deltaValue >= 0 ? '+' : ''}{formatBRL(p.deltaValue)}
                    </td>
                    <td className={`py-4 px-2 ${p.deltaPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {p.deltaPercent >= 0 ? '+' : ''}{formatPercentBR(p.deltaPercent)}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">{p.baseICM.toFixed(0)}%</span>
                        <ArrowRight size={12} className="text-zinc-300" />
                        <span>{p.currentICM.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Seller Table */}
          <div className="p-6 bg-white rounded-3xl border border-black/5 shadow-sm overflow-x-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Movimentação Individual</h3>
              <div className="flex bg-zinc-100 p-1 rounded-lg w-full sm:w-auto">
                {[
                  { id: 'score', label: 'Geral (Score)' },
                  { id: 'mercantil', label: 'Mercantil' },
                  { id: 'cdc', label: 'CDC' },
                  { id: 'services', label: 'Serviços' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFocus(f.id as any)}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[10px] font-bold transition-all ${focus === f.id ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
                  >
                    {f.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-zinc-400 border-b">
                  <th className="pb-3 px-2">Vendedor</th>
                  <th className="pb-3 px-2">
                    {focus === 'score' ? 'Score A/B' : `${focus.toUpperCase()} A/B`}
                  </th>
                  <th className="pb-3 px-2">Variação</th>
                  <th className="pb-3 px-2">Ranking A/B</th>
                  <th className="pb-3 px-2">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {comparison.sellers.map((s, idx) => (
                  <tr key={idx} className="text-sm font-bold text-zinc-900">
                    <td className="py-4 px-2">{s.name}</td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        {focus === 'score' ? (
                          <>
                            <span className="text-zinc-400">{s.baseScore.toFixed(1)}</span>
                            <ArrowRight size={12} className="text-zinc-300" />
                            <span>{s.currentScore.toFixed(1)}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-zinc-400">{focus === 'mercantil' || focus === 'cdc' || focus === 'services' ? formatBRL(s.pillars[focus].base) : s.pillars[focus].base}</span>
                            <ArrowRight size={12} className="text-zinc-300" />
                            <span>{focus === 'mercantil' || focus === 'cdc' || focus === 'services' ? formatBRL(s.pillars[focus].current) : s.pillars[focus].current}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className={`py-4 px-2 ${
                      (focus === 'score' ? s.deltaScore : s.pillars[focus].delta) >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {focus === 'score' ? (
                        <>
                          {s.deltaScore >= 0 ? '+' : ''}{s.deltaScore.toFixed(1)}
                        </>
                      ) : (
                        <>
                          {s.pillars[focus].delta >= 0 ? '+' : ''}{formatBRL(s.pillars[focus].delta)}
                        </>
                      )}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">#{s.baseRank}</span>
                        <ArrowRight size={12} className="text-zinc-300" />
                        <span>#{s.currentRank}</span>
                        {s.deltaRank !== 0 && (
                          <span className={`text-[10px] ${s.deltaRank > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ({s.deltaRank > 0 ? '+' : ''}{s.deltaRank})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      {s.alerts.length > 0 ? (
                        <div className="flex gap-1">
                          {s.alerts.map((a, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-red-500" title={a} />
                          ))}
                        </div>
                      ) : (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AlertsPanel alerts={comparison.alerts} />

          {/* Strategic Diagnosis Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-zinc-900" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Diagnóstico Estratégico do Oráculo</h3>
              </div>
              {!diagnosis && !isGeneratingDiagnosis && (
                <button
                  onClick={handleGenerateDiagnosis}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2"
                >
                  <Sparkles size={14} /> GERAR DIAGNÓSTICO IA
                </button>
              )}
            </div>

            {isGeneratingDiagnosis ? (
              <div className="p-12 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 size={32} className="text-zinc-400 animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-zinc-900">O Oráculo está processando os dados...</p>
                  <p className="text-xs text-zinc-500">Analisando tendências, dependências e padrões de execução.</p>
                </div>
              </div>
            ) : diagnosis ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Sparkles size={120} />
                </div>
                <div className="prose prose-sm prose-zinc max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-[10px] prose-headings:text-zinc-400 prose-p:text-zinc-700 prose-p:font-medium prose-p:leading-relaxed prose-strong:text-zinc-900 prose-ul:text-zinc-700">
                  <ReactMarkdown>{diagnosis}</ReactMarkdown>
                </div>
                <div className="mt-8 pt-6 border-t border-zinc-200 flex justify-between items-center">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Diagnóstico Gerado via Inteligência Artificial</span>
                  <button
                    onClick={handleGenerateDiagnosis}
                    className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    REGERAR DIAGNÓSTICO
                  </button>
                </div>
              </motion.div>
            ) : null}
          </div>
          
          <ExportButtons data={currentData} comparison={comparison} />
        </div>
      )}
    </div>
  );
};
