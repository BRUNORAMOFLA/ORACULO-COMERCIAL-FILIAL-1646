
import { useState, useMemo } from 'react';
import { DataInput } from './components/DataInput';
import { Dashboard } from './components/Dashboard';
import { AISummary } from './components/AISummary';
import { OracleData } from './types/oracle';
import { processOracle } from './logic/oracleProcessor';
import { motion, AnimatePresence } from 'motion/react';
import { CrystalBall } from './components/CrystalBall';
import { LayoutDashboard, FileInput, Info, Save, Clock } from 'lucide-react';
import { formatDateTimeBR } from './utils/formatters';

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
  const [data, setData] = useState<OracleData>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'input' | 'dashboard'>('input');

  const processedData = useMemo(() => processOracle(data), [data]);

  const handleSave = () => {
    // In a real app, this would save to a database
    console.log('Saving Oracle Data:', processedData);
    setActiveTab('dashboard');
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
                  <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-xl">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Info size={16} /> Arquitetura Estrutural
                    </h3>
                    <ul className="space-y-3 text-xs text-zinc-400 leading-relaxed">
                      <li className="flex gap-2">
                        <span className="text-white">•</span>
                        <span>Modelo de dados centralizado e serializável.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-white">•</span>
                        <span>Cálculos automáticos de ICM, GAP e Score.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-white">•</span>
                        <span>Detecção de Tríplice Coroa e Dependência.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-6 border border-dashed border-zinc-300 rounded-2xl flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                      <CrystalBall />
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">O Oráculo processa os dados em tempo real através da camada de lógica centralizada.</p>
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

      <footer className="max-w-7xl mx-auto px-4 py-8 md:py-12 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span>© 2026 ORÁCULO COMERCIAL</span>
          <span className="flex items-center gap-1"><Clock size={10} /> GERADO EM: {formatDateTimeBR(processedData.generatedAt)}</span>
        </div>
        <div className="flex gap-6">
          <span>Integridade de Dados: 100%</span>
          <span>Versão: 2.1.0</span>
        </div>
      </footer>
    </div>
  );
}
