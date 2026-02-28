
import React, { useState } from 'react';
import { OracleData } from '../types/oracle';
import { 
  Activity, 
  Target, 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Package,
  Trophy,
  Star,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { formatNumberBR, formatCurrencyBR } from '../utils/formatters';
import { FeedbackModal } from './FeedbackModal';
import { Seller } from '../types/oracle';

interface Props {
  data: OracleData;
}

export const Dashboard: React.FC<Props> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'crown' | 'mvp'>('crown');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  const healthData = [
    { name: 'Saúde', value: data.store.healthIndex },
    { name: 'Restante', value: Math.max(0, 100 - data.store.healthIndex) },
  ];

  const COLORS = ['#18181b', '#f4f4f5'];

  const getHealthColor = (classification: string) => {
    if (classification.includes('Alta')) return 'text-emerald-600';
    if (classification.includes('Competitiva')) return 'text-blue-600';
    if (classification.includes('Atenção')) return 'text-amber-600';
    return 'text-red-600';
  };

  const tripleCrownSellers = data.sellers.filter(s => s.isTripleCrown);
  const mvpSeller = data.sellers.find(s => s.id === data.mvpId);

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Saúde da Unidade</span>
            <Activity size={14} className="text-zinc-300" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{data.store.healthIndex.toFixed(1)}%</span>
            <span className={`text-[9px] font-bold uppercase ${getHealthColor(data.store.classification)}`}>{data.store.classification}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Execução Operacional</span>
            <Package size={14} className="text-zinc-300" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">
              {((data.store.pillars.operational.cards.achievement + data.store.pillars.operational.combos.achievement) / 2).toFixed(0)}%
            </span>
            <span className="text-[9px] font-bold uppercase text-zinc-500">Cartões/Combos</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Nível de Dependência</span>
            <ShieldAlert size={14} className="text-zinc-300" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900">{data.distribution.top1Contribution.toFixed(1)}%</span>
            <span className="text-[9px] font-bold uppercase text-zinc-500">{data.distribution.dependencyLevel}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Projeção de Fechamento</span>
            <TrendingUp size={14} className="text-zinc-300" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900">{data.projection.probability}</span>
              <span className="text-[9px] font-bold uppercase text-zinc-500">Tendência</span>
            </div>
            <p className="text-[8px] font-bold text-zinc-400 uppercase">Base: média diária × dias úteis restantes</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 text-white p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-500 block">Período de Análise</span>
            <span className="text-sm font-bold">{data.store.period.label || "Período não definido"}</span>
          </div>
          <Calendar size={20} className="text-zinc-700" />
        </div>
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">Maturidade do Time</span>
            <span className="text-sm font-bold text-zinc-900">{data.maturityIndex.classification}</span>
          </div>
          <Users size={20} className="text-zinc-200" />
        </div>
      </div>

      {/* Projection Details */}
      {data.projection.isAvailable ? (
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-zinc-400 mb-6">Detalhamento da Projeção</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Mercantil', proj: data.projection.mercantilProjected, gap: data.projection.mercantilGap, meta: data.store.pillars.mercantil.meta },
              { label: 'CDC', proj: data.projection.cdcProjected, gap: data.projection.cdcGap, meta: data.store.pillars.cdc.meta },
              { label: 'Serviços', proj: data.projection.servicesProjected, gap: data.projection.servicesGap, meta: data.store.pillars.services.meta },
            ].map((p) => (
              <div key={p.label} className="p-4 bg-zinc-50 rounded-xl space-y-3">
                <span className="text-[10px] font-black uppercase text-zinc-400">{p.label}</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-black text-zinc-900">{formatCurrencyBR(p.proj)}</span>
                  <span className="text-[10px] font-bold text-zinc-500">Projetado</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-zinc-400">GAP VS META</span>
                  <span className={p.gap <= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {p.gap <= 0 ? 'META ATINGIDA' : formatCurrencyBR(p.gap)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-700 text-xs font-bold text-center">
          Projeção indisponível (dados insuficientes para cálculo de tendência)
        </div>
      )}

      {/* Recognition Section */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-zinc-900" />
            <h3 className="text-xs font-bold uppercase text-zinc-900">Reconhecimento e Destaques</h3>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-lg w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('crown')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'crown' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              TRÍPLICE COROA
            </button>
            <button 
              onClick={() => setActiveTab('mvp')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'mvp' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              MVP
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 min-h-[200px]">
          <AnimatePresence mode="wait">
            {activeTab === 'crown' ? (
              <motion.div 
                key="crown"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-zinc-900 text-white rounded-xl gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${Object.values(data.store.tripleCrownStatus).every(v => v) ? 'bg-amber-500' : 'bg-white/10'}`}>
                      <Award size={20} className={Object.values(data.store.tripleCrownStatus).every(v => v) ? 'text-zinc-900' : 'text-white'} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">Status da Unidade</span>
                      <span className="text-sm font-bold">{Object.values(data.store.tripleCrownStatus).every(v => v) ? 'TRÍPLICE COROA CONSOLIDADA' : 'EM BUSCA DA TRÍPLICE COROA'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-center">
                    {['mercantil', 'cdc', 'services'].map(p => (
                      <div key={p} className={`px-2 py-1 rounded text-[8px] font-black uppercase ${data.store.tripleCrownStatus[p as keyof typeof data.store.tripleCrownStatus] ? 'bg-emerald-500' : 'bg-white/10'}`}>
                        {p === 'services' ? 'Serviços' : p}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400">Vendedores Elegíveis</h4>
                  {tripleCrownSellers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tripleCrownSellers.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => setSelectedSeller(s)}
                          className="flex items-center gap-3 p-3 border rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <Star size={16} fill="currentColor" />
                          </div>
                          <span className="text-sm font-bold text-zinc-900 underline decoration-zinc-200 underline-offset-4">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">Nenhum vendedor atingiu a Tríplice Coroa neste período.</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="mvp"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col md:flex-row items-center gap-8"
              >
                {mvpSeller ? (
                  <>
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-zinc-900 flex items-center justify-center shadow-2xl">
                        <span className="text-4xl font-black text-white">{mvpSeller.name.charAt(0)}</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-amber-500 p-2 rounded-full border-4 border-white">
                        <Trophy size={20} className="text-zinc-900" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-600 block tracking-widest">Most Valuable Player</span>
                        <button 
                          onClick={() => setSelectedSeller(mvpSeller)}
                          className="text-2xl font-black text-zinc-900 hover:opacity-70 transition-opacity underline decoration-zinc-200 underline-offset-4"
                        >
                          {mvpSeller.name}
                        </button>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <p className="text-xs text-zinc-600 leading-relaxed italic">"{data.mvpJustification}"</p>
                      </div>
                      <div className="flex justify-center md:justify-start gap-4">
                        <div className="text-center">
                          <span className="text-[8px] font-bold text-zinc-400 uppercase block">Score</span>
                          <span className="text-sm font-black text-zinc-900">{mvpSeller.score.toFixed(1)}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] font-bold text-zinc-400 uppercase block">Status</span>
                          <span className="text-sm font-black text-zinc-900">{mvpSeller.classification}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center py-12">
                    <p className="text-sm text-zinc-500 font-bold uppercase">MVP indisponível (dados insuficientes)</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Gauge */}
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col items-center">
          <h3 className="text-xs font-bold uppercase text-zinc-400 mb-6 self-start">Performance Composta</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={210}
                  endAngle={-30}
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-5xl font-black text-zinc-900">{data.store.healthIndex.toFixed(0)}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Score Global</span>
            </div>
          </div>
        </div>

        {/* Pillars Performance */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-xs font-bold uppercase text-zinc-400 mb-6">Execução por Pilar</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Mercantil', icm: data.store.pillars.mercantil.icm, proj: data.projection.mercantilProjected / (data.store.pillars.mercantil.meta || 1) * 100 },
                { name: 'CDC', icm: data.store.pillars.cdc.icm, proj: data.projection.cdcProjected / (data.store.pillars.cdc.meta || 1) * 100 },
                { name: 'Serviços', icm: data.store.pillars.services.icm, proj: data.projection.servicesProjected / (data.store.pillars.services.meta || 1) * 100 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} fontWeight={700} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} domain={[0, 120]} />
                <Tooltip 
                  cursor={{ fill: '#f8f9fa' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="icm" name="ICM Atual" fill="#18181b" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="proj" name="Projeção (%)" fill="#e4e4e7" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Seller Rankings */}
      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase text-zinc-400">Ranking de Performance Individual</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Elite</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Alto</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Parcial</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Risco</div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-zinc-400 border-b">
                <th className="pb-3 px-2">Pos</th>
                <th className="pb-3 px-2">Vendedor</th>
                <th className="pb-3 px-2 text-center">Mercantil</th>
                <th className="pb-3 px-2 text-center">CDC</th>
                <th className="pb-3 px-2 text-center">Serviços</th>
                <th className="pb-3 px-2 text-right">Score</th>
                <th className="pb-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {data.sellers.sort((a, b) => b.score - a.score).map((s, idx) => (
                <tr key={s.id} className="group hover:bg-zinc-50 transition-colors">
                  <td className="py-4 px-2 text-xs font-bold text-zinc-400">#{idx + 1}</td>
                  <td className="py-4 px-2">
                    <button 
                      onClick={() => setSelectedSeller(s)}
                      className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left"
                    >
                      <span className="text-sm font-bold text-zinc-900 underline decoration-zinc-200 underline-offset-4">{s.name || `Vendedor ${idx + 1}`}</span>
                      {s.isTripleCrown && <Award size={14} className="text-amber-500" />}
                    </button>
                  </td>
                  <td className="py-4 px-2 text-center text-xs font-medium text-zinc-600">{s.pillars.mercantil.icm.toFixed(1)}%</td>
                  <td className="py-4 px-2 text-center text-xs font-medium text-zinc-600">{s.pillars.cdc.icm.toFixed(1)}%</td>
                  <td className="py-4 px-2 text-center text-xs font-medium text-zinc-600">{s.pillars.services.icm.toFixed(1)}%</td>
                  <td className="py-4 px-2 text-right">
                    <span className="text-sm font-black text-zinc-900">{s.score.toFixed(1)}%</span>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                      s.classification === 'Elite' ? 'bg-emerald-50 text-emerald-700' :
                      s.classification === 'Alto Contribuidor' ? 'bg-blue-50 text-blue-700' :
                      s.classification === 'Parcial' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {s.classification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedSeller && (
          <FeedbackModal 
            seller={selectedSeller} 
            period={data.store.period} 
            onClose={() => setSelectedSeller(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
