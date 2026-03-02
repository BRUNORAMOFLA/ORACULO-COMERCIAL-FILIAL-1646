
import { useState, useMemo, useEffect } from 'react';
import { DataInput } from './components/DataInput';
import { Dashboard } from './components/Dashboard';
import { EvolutionTab } from './components/evolution/EvolutionTab';
import { AISummary } from './components/AISummary';
import { DataImporter } from './components/DataImporter';
import { OracleData, OracleHistory, HistoryRecord, Period, OracleHistoryV1 } from './types/oracle';
import { processOracle } from './logic/oracleProcessor';
import { motion, AnimatePresence } from 'motion/react';
import { CrystalBall } from './components/CrystalBall';
import { LayoutDashboard, FileInput, Info, Save, Clock, RotateCcw, History, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { formatDateTimeBR, getISOWeek, generatePeriodLabel } from './utils/formatters';
import { SwitchPeriodModal } from './components/SwitchPeriodModal';

const STORAGE_KEY = 'oraculo-comercial-storage';
const HISTORY_KEY = 'oraculo-comercial-historico';
const HISTORY_V1_KEY = 'oracle_history:v1';

const parseDateSafe = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const migrateHistory = (oldRegistros: HistoryRecord[]): OracleHistoryV1 => {
  const newHistory: OracleHistoryV1 = { diario: [], semanal: [], mensal: [] };
  oldRegistros.forEach(record => {
    const type = record.tipo || record.dados.store.period.type;
    if (type === 'daily') newHistory.diario.push(record);
    else if (type === 'weekly') newHistory.semanal.push(record);
    else if (type === 'monthly') newHistory.mensal.push(record);
  });
  return newHistory;
};

const formatHistoryLabel = (record: HistoryRecord) => {
  const { id, dados } = record;
  if (dados?.store?.period) {
    return generatePeriodLabel(dados.store.period);
  }
  
  if (!id || typeof id !== 'string') return "Registro inválido";
  const parts = id.split('-');
  if (parts.length < 4) return "Registro legado (revisar)";

  const year = parts[1];
  const type = parts[2].toLowerCase();
  const identifier = parts.slice(3).join('-');

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  if (type === 'monthly' || type === 'mensal') {
    const monthIndex = parseInt(identifier) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year} – Mensal`;
    }
  }

  if (type === 'weekly' || type === 'semanal') {
    let weekDisplay = identifier;
    if (identifier.includes('_') || identifier.length > 2) {
      // Fallback for old range-based format or date-based identifier
      try {
        const dateStr = identifier.includes('_') ? identifier.split('_')[0] : identifier;
        const date = parseDateSafe(dateStr);
        weekDisplay = String(getISOWeek(date));
      } catch (e) {
        weekDisplay = identifier;
      }
    }
    const cleanWeek = weekDisplay.replace(/[^0-9]/g, '');
    return `Semana ${cleanWeek.padStart(2, '0')} – ${year}`;
  }

  if (type === 'daily' || type === 'diario') {
    const dateParts = identifier.split('-');
    if (dateParts.length === 3) {
      return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} – Diário`;
    }
  }

  return `Registro: ${id}`;
};

const INITIAL_STATE: OracleData = {
  store: {
    name: 'Loja 1646',
    period: {
      type: 'daily',
      label: '',
      date: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
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
    mercantilStatus: 'SEM BASE', cdcStatus: 'SEM BASE', servicesStatus: 'SEM BASE',
    probability: '', isAvailable: false,
    daysTotal: 0, daysElapsed: 0
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
  
  const [activeTab, setActiveTab] = useState<'input' | 'dashboard' | 'evolution'>('input');
  const [periodMode, setPeriodMode] = useState<'DIARIO' | 'SEMANAL' | 'MENSAL'>('DIARIO');
  const [isDirty, setIsDirty] = useState(false);
  const [pendingPeriodChange, setPendingPeriodChange] = useState<Period | null>(null);
  const [autoSave, setAutoSave] = useState(false);
  
  const [history, setHistory] = useState<OracleHistoryV1>(() => {
    try {
      const savedV1 = localStorage.getItem(HISTORY_V1_KEY);
      if (savedV1) return JSON.parse(savedV1);

      const oldSaved = localStorage.getItem(HISTORY_KEY);
      if (oldSaved) {
        const oldHistory = JSON.parse(oldSaved);
        const migrated = migrateHistory(oldHistory.registros || []);
        localStorage.setItem(HISTORY_V1_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch (e) {
      console.error("Error loading history:", e);
    }
    return { diario: [], semanal: [], mensal: [] };
  });

  const currentHistory = useMemo(() => {
    if (periodMode === 'DIARIO') return history.diario;
    if (periodMode === 'SEMANAL') return history.semanal;
    return history.mensal;
  }, [history, periodMode]);

  const processedData = useMemo(() => processOracle(data, currentHistory), [data, currentHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(HISTORY_V1_KEY, JSON.stringify(history));
  }, [history]);

  const generateRecordId = (d: OracleData) => {
    const s = d.store;
    const p = s.period;
    const storePart = (s.name || 'LOJA').replace(/\s+/g, '').toUpperCase();
    const yearPart = p.year || new Date().getFullYear();
    const typePart = p.type;
    
    let idPart = '';
    switch (p.type) {
      case 'daily': idPart = p.date || 'no-date'; break;
      case 'monthly': idPart = String(p.month || 1).padStart(2, '0'); break;
      case 'weekly':
        const date = p.startDate ? parseDateSafe(p.startDate) : new Date();
        const weekNum = getISOWeek(date);
        idPart = String(weekNum).padStart(2, '0');
        break;
      case 'custom': idPart = `${p.startDate}_${p.endDate}`; break;
      default: idPart = 'unknown';
    }
    
    return `${storePart}-${yearPart}-${typePart}-${idPart}`;
  };

  useEffect(() => {
    if (autoSave && isDirty) {
      const timer = setTimeout(() => {
        handleSave(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data, autoSave, isDirty]);

  const handleDataChange = (newData: OracleData) => {
    setData(newData);
    setIsDirty(true);
  };

  const handleSave = (silent = false) => {
    try {
      const recordId = generateRecordId(data);
      const type = data.store.period.type;
      const modeKey = type === 'daily' ? 'diario' : type === 'weekly' ? 'semanal' : 'mensal';
      const registros = history[modeKey];
      
      const label = generatePeriodLabel(data.store.period);
      const startDate = data.store.period.startDate || '';
      const endDate = data.store.period.endDate || '';
      
      const existingIndex = registros.findIndex(r => {
        const p = r.dados.store.period;
        return generatePeriodLabel(p) === label && p.startDate === startDate && p.endDate === endDate;
      });
      
      const newRecord: HistoryRecord = {
        id: recordId,
        tipo: type,
        dataReferencia: recordId,
        dados: JSON.parse(JSON.stringify({ ...processedData, generatedAt: new Date().toISOString() }))
      };

      const newRegistros = [...registros];
      if (existingIndex >= 0) {
        newRegistros[existingIndex] = newRecord;
      } else {
        newRegistros.unshift(newRecord);
      }

      setHistory(prev => ({ ...prev, [modeKey]: newRegistros }));
      setData(newRecord.dados);
      setIsDirty(false);
      
      if (!silent) {
        setActiveTab('dashboard');
      }
      return true;
    } catch (err) {
      console.error("Error saving record:", err);
      if (!silent) alert("Erro ao salvar os dados.");
      return false;
    }
  };

  const handlePeriodChangeRequest = (newPeriod: Period) => {
    if (isDirty) {
      setPendingPeriodChange(newPeriod);
    } else {
      applyPeriodChange(newPeriod);
    }
  };

  const applyPeriodChange = (newPeriod: Period) => {
    const newData = JSON.parse(JSON.stringify(data));
    newData.store.period = newPeriod;
    
    const newRecordId = generateRecordId(newData);
    const type = newPeriod.type;
    const modeKey = type === 'daily' ? 'diario' : type === 'weekly' ? 'semanal' : 'mensal';
    const existingRecord = history[modeKey].find(r => r.id === newRecordId);

    if (existingRecord) {
      setData(JSON.parse(JSON.stringify(existingRecord.dados)));
    } else {
      // Start fresh for this period, but keep store name
      const freshData = JSON.parse(JSON.stringify(INITIAL_STATE));
      freshData.store.name = data.store.name;
      freshData.store.period = newPeriod;
      setData(freshData);
    }
    
    setIsDirty(false);
    setPendingPeriodChange(null);
  };

  const loadFromHistory = (recordId: string, mode: 'DIARIO' | 'SEMANAL' | 'MENSAL') => {
    const modeKey = mode === 'DIARIO' ? 'diario' : mode === 'SEMANAL' ? 'semanal' : 'mensal';
    const record = history[modeKey].find(r => r.id === recordId);
    if (record) {
      setPeriodMode(mode);
      setData(JSON.parse(JSON.stringify(record.dados)));
      setIsDirty(false);
      setActiveTab('dashboard');
    }
  };

  const removeFromHistory = (recordId: string, mode: 'DIARIO' | 'SEMANAL' | 'MENSAL') => {
    if (window.confirm("Deseja remover este registro do histórico?")) {
      const modeKey = mode === 'DIARIO' ? 'diario' : mode === 'SEMANAL' ? 'semanal' : 'mensal';
      setHistory(prev => ({
        ...prev,
        [modeKey]: prev[modeKey].filter(r => r.id !== recordId)
      }));
    }
  };

  const resetData = () => {
    if (window.confirm("Tem certeza que deseja apagar todos os dados? Essa ação não pode ser desfeita.")) {
      localStorage.removeItem("oraculo-comercial-storage");
      localStorage.removeItem("oraculo-comercial-historico");
      window.location.reload();
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <div className="min-h-screen bg-white text-primary font-sans selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-serif italic text-lg md:text-xl">O</span>
            </div>
            <div className="truncate">
              <h1 className="text-sm md:text-lg font-bold tracking-tight leading-none truncate text-primary">ORÁCULO COMERCIAL</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="hidden xs:block text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 truncate">Gestão Estratégica</p>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${isDirty ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {isDirty ? <><AlertCircle size={8} /> Alterações não salvas</> : <><CheckCircle2 size={8} /> Dados Salvos</>}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex items-center bg-zinc-100 p-1 rounded-xl flex-shrink-0 gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
              <span className="text-[8px] font-black uppercase text-zinc-400">Auto-Save</span>
              <button 
                onClick={() => setAutoSave(!autoSave)}
                className={`w-8 h-4 rounded-full transition-all relative ${autoSave ? 'bg-emerald-500' : 'bg-zinc-300'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoSave ? 'left-4.5' : 'left-0.5'}`} />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-lg shadow-sm">
              {[
                { label: 'Diário', mode: 'DIARIO' as const, records: history.diario },
                { label: 'Semanal', mode: 'SEMANAL' as const, records: history.semanal },
                { label: 'Mensal', mode: 'MENSAL' as const, records: history.mensal }
              ].map((h) => (
                <div key={h.mode} className="relative group">
                  <select 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('remove:')) {
                        removeFromHistory(val.replace('remove:', ''), h.mode);
                        e.target.value = "";
                      } else if (val) {
                        loadFromHistory(val, h.mode);
                        e.target.value = "";
                      }
                    }}
                    className={`bg-transparent border-none text-[9px] md:text-[10px] font-black px-2 py-1.5 rounded-md outline-none cursor-pointer transition-colors uppercase tracking-tighter ${periodMode === h.mode ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600'}`}
                    defaultValue=""
                  >
                    <option value="" disabled>{h.label}</option>
                    {h.records.map(r => (
                      <optgroup key={r.id} label={formatHistoryLabel(r)}>
                        <option value={r.id}>Carregar</option>
                        <option value={`remove:${r.id}`} className="text-red-500">Remover</option>
                      </optgroup>
                    ))}
                    {h.records.length === 0 && <option disabled>Vazio</option>}
                  </select>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'input' ? 'bg-white shadow-sm text-primary' : 'text-zinc-500 hover:text-primary'}`}
            >
              <FileInput size={14} className="hidden xs:block" /> ENTRADA
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-primary' : 'text-zinc-500 hover:text-primary'}`}
            >
              <LayoutDashboard size={14} className="hidden xs:block" /> DASHBOARD
            </button>
            <button 
              onClick={() => {
                setActiveTab('evolution');
                // Auto-set periodMode based on current data period type
                const type = data.store.period.type;
                if (type === 'daily') setPeriodMode('DIARIO');
                else if (type === 'weekly') setPeriodMode('SEMANAL');
                else if (type === 'monthly') setPeriodMode('MENSAL');
              }}
              className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${activeTab === 'evolution' ? 'bg-white shadow-sm text-primary' : 'text-zinc-500 hover:text-primary'}`}
            >
              <TrendingUp size={14} className="hidden xs:block" /> EVOLUÇÃO
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
                  <DataInput 
                    data={data} 
                    onChange={handleDataChange} 
                    onPeriodChangeRequest={handlePeriodChangeRequest}
                  />
                  <div className="mt-8">
                    <button 
                      onClick={() => handleSave()}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                    >
                      <Save size={20} className="text-accent" /> PROCESSAR E SALVAR
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  <DataImporter onImport={handleDataChange} currentData={data} />
                  
                  <div className="p-6 border border-dashed border-zinc-300 rounded-2xl flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                      <CrystalBall />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium uppercase font-bold tracking-tight">O Oráculo processa os dados em tempo real através da camada de lógica centralizada.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">{processedData.store.name}</h2>
                  <p className="text-xs md:text-sm font-medium text-zinc-500">Relatório de Performance Estratégica • {processedData.store.period.label}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Status da Operação</span>
                  <div className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase ${
                    processedData.store.healthIndex >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                    processedData.store.healthIndex >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-accent/10 text-accent'
                  }`}>
                    {processedData.store.classification}
                  </div>
                </div>
              </div>

              <Dashboard data={processedData} />
              
              <AISummary data={processedData} />
            </motion.div>
          ) : (
            <motion.div
              key="evolution"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <EvolutionTab 
                history={{ registros: currentHistory }} 
                currentData={processedData} 
                periodMode={periodMode}
                onPeriodModeChange={setPeriodMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 border-t border-primary/10 flex flex-col gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 w-full">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="text-primary">© 2026 ORÁCULO COMERCIAL</span>
            <span className="flex items-center gap-1"><Clock size={10} className="text-accent" /> GERADO EM: {formatDateTimeBR(processedData.generatedAt)}</span>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center sm:justify-end">
            <button 
              type="button"
              id="reset-button"
              onClick={(e) => {
                e.preventDefault();
                resetData();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent/5 text-accent hover:bg-accent/10 transition-all cursor-pointer border border-accent/10 active:scale-95 min-h-[44px] shadow-sm relative z-20"
            >
              <RotateCcw size={14} className="pointer-events-none" /> LIMPAR DADOS
            </button>
            <div className="flex gap-4">
              <span>Integridade de Dados: 100%</span>
              <span>Versão: 2.1.0</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center text-center opacity-30 space-y-0.5">
          <span className="text-[8px] tracking-[0.3em]">ORÁCULO COMERCIAL</span>
          <span className="text-[7px] tracking-widest font-medium lowercase italic normal-case">Idealizado por Bruno Ramos</span>
        </div>
      </footer>

      <SwitchPeriodModal 
        isOpen={!!pendingPeriodChange}
        onSaveAndContinue={() => {
          if (handleSave(true)) {
            applyPeriodChange(pendingPeriodChange!);
          }
        }}
        onContinueWithoutSaving={() => {
          applyPeriodChange(pendingPeriodChange!);
        }}
        onCancel={() => setPendingPeriodChange(null)}
      />
    </div>
  );
}
