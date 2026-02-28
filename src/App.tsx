
import { useState, useMemo, useEffect } from 'react';
import { DataInput } from './components/DataInput';
import { Dashboard } from './components/Dashboard';
import { AISummary } from './components/AISummary';
import { DataImporter } from './components/DataImporter';
import { OracleData, OracleHistory, HistoryRecord } from './types/oracle';
import { processOracle } from './logic/oracleProcessor';
import { motion, AnimatePresence } from 'motion/react';
import { CrystalBall } from './components/CrystalBall';
import { LayoutDashboard, FileInput, Info, Save, Clock, RotateCcw, History } from 'lucide-react';
import { formatDateTimeBR } from './utils/formatters';

const STORAGE_KEY = 'oraculo-comercial-storage';
const HISTORY_KEY = 'oraculo-comercial-historico';

const INITIAL_STATE: OracleData = {
  store: {
    name: 'Loja 1646',
    period: {
      type: 'daily',
      label: '',
      date: new Date().toISOString().split('T')[0],
      businessDaysTotal: 25,
      businessDaysElapsed: 10
    },
    pillars: {
      mercantil: { meta: 0, realized: 0, icm: 0, gap: 0 },
      cdc: { 
        meta: 0, realized: 0, icm: 0, gap: 0,
        participation: { meta: 0, realized: 0, achievement: 0 }
      },
      services: { 
        meta: 0, realized: 0, icm: 0, gap: 0,
        efficiency: { meta: 0, realized: 0, achievement: 0 }
      },
      operational: {
        cards: { meta: 0, realized: 0, achievement: 0 },
        combos: { meta: 0, realized: 0, achievement: 0 }
      }
    },
    healthIndex: 0,
    classification: '',
    tripleCrownStatus: { mercantil: false, cdc: false, services: false }
  },
  sellers: [],
  distribution: { top1Contribution: 0, top2Contribution: 0, dependencyLevel: '' },
  maturityIndex: { above100Percent: 0, below80Percent: 0, classification: '' },
  projection: { 
    mercantilProjected: 0, cdcProjected: 0, servicesProjected: 0, 
    mercantilGap: 0, cdcGap: 0, servicesGap: 0,
    probability: '', isAvailable: false 
  },
  simulator: { scenario: '', newHealthIndex: 0, newClassification: '' },
  history: [],
  generatedAt: new Date().toISOString()
};

export default function App() {
  const [data, setData] = useState<OracleData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  
  const [activeTab, setActiveTab] = useState<'input' | 'dashboard'>('input');
  const [history, setHistory] = useState<OracleHistory>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : { registros: [] };
  });

  const processedData = useMemo(() => processOracle(data), [data]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const generateRecordId = (d: OracleData) => {
    const p = d.store.period;
    switch (p.type) {
      case 'daily': return p.date || 'no-date';
      case 'monthly': return `${p.year}-${String(p.month).padStart(2, '0')}`;
      case 'weekly':
      case 'custom': return `${p.startDate}_${p.endDate}`;
      default: return 'unknown';
    }
  };

  const handleSave = () => {
    const recordId = generateRecordId(data);
    const existingIndex = history.registros.findIndex(r => r.id === recordId);
    
    const newRecord: HistoryRecord = {
      id: recordId,
      tipo: data.store.period.type,
      dataReferencia: recordId,
      dados: { ...data, generatedAt: new Date().toISOString() }
    };

    if (existingIndex >= 0) {
      if (window.confirm(`Já existe um registro para ${recordId}. Deseja atualizar os dados existentes?`)) {
        const newRegistros = [...history.registros];
        newRegistros[existingIndex] = newRecord;
        setHistory({ registros: newRegistros });
        setData(newRecord.dados);
        setActiveTab('dashboard');
      }
    } else {
      setHistory({ registros: [newRecord, ...history.registros] });
      setData(newRecord.dados);
      setActiveTab('dashboard');
    }
  };

  const loadFromHistory = (recordId: string) => {
    const record = history.registros.find(r => r.id === recordId);
    if (record) {
      setData(record.dados);
      setActiveTab('dashboard');
    }
  };

  const resetData = () => {
    if (window.confirm("Tem certeza que deseja apagar todos os dados? Essa ação não pode ser desfeita.")) {
      localStorage.removeItem("oraculo-comercial-storage");
      localStorage.removeItem("oraculo-comercial-historico");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-zinc-900/20">
              <span className="text-white font-serif italic text-lg md:text-xl">O</span>
            </div>
            <div className="truncate">
              <h1 className="text-sm md:text-lg font-bold tracking-tight leading-none truncate">ORÁCULO COMERCIAL</h1>
              <p className="hidden xs:block text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1 truncate">Gestão Estratégica</p>
            </div>
          </div>

          <nav className="flex bg-zinc-100 p-1 rounded-xl flex-shrink-0">
            {history.registros.length > 0 && (
              <div className="mr-2 flex items-center">
                <select 
                  onChange={(e) => loadFromHistory(e.target.value)}
                  className="bg-white border-none text-[10px] md:text-xs font-bold px-2 py-1.5 rounded-lg outline-none cursor-pointer text-zinc-600 hover:text-zinc-900 transition-colors"
                  defaultValue=""
                >
                  <option value="" disabled>CARREGAR HISTÓRICO</option>
                  {history.registros.map(r => (
                    <option key={r.id} value={r.id}>{r.id} ({r.tipo})</option>
                  ))}
                </select>
              </div>
            )}
            <button 
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'input' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <FileInput size={14} className="hidden xs:block" /> ENTRADA
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <LayoutDashboard size={14} className="hidden xs:block" /> DASHBOARD
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <DataInput data={data} onChange={setData} />
                  <div className="mt-8">
                    <button 
                      onClick={handleSave}
                      className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/20"
                    >
                      <Save size={20} /> PROCESSAR E SALVAR
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  <DataImporter onImport={setData} currentData={data} />
                  
                  <div className="p-6 border border-dashed border-zinc-300 rounded-2xl flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                      <CrystalBall />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase font-bold tracking-tight">O Oráculo processa os dados em tempo real através da camada de lógica centralizada.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">{processedData.store.name}</h2>
                  <p className="text-xs md:text-sm font-medium text-zinc-500">Relatório de Performance Estratégica • {processedData.store.period.label}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Status da Operação</span>
                  <div className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase ${
                    processedData.store.healthIndex >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                    processedData.store.healthIndex >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {processedData.store.classification}
                  </div>
                </div>
              </div>

              <Dashboard data={processedData} />
              
              <AISummary data={processedData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span>© 2026 ORÁCULO COMERCIAL</span>
          <span className="flex items-center gap-1"><Clock size={10} /> GERADO EM: {formatDateTimeBR(processedData.generatedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center sm:justify-end">
          <button 
            type="button"
            id="reset-button"
            onClick={(e) => {
              e.preventDefault();
              resetData();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer border border-red-100 active:scale-95 min-h-[44px] shadow-sm relative z-20"
          >
            <RotateCcw size={14} className="pointer-events-none" /> LIMPAR DADOS
          </button>
          <div className="flex gap-4">
            <span>Integridade de Dados: 100%</span>
            <span>Versão: 2.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
