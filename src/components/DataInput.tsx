
import React from 'react';
import { OracleData, Seller, PeriodType } from '../types/oracle';
import { Plus, Trash2, UserPlus, Calendar, CreditCard, Package } from 'lucide-react';
import { NumberInput } from './NumberInput';

interface Props {
  data: OracleData;
  onChange: (newData: OracleData) => void;
  onPeriodChangeRequest: (newPeriod: any) => void;
}

export const DataInput: React.FC<Props> = ({ data, onChange, onPeriodChangeRequest }) => {
  const updateStorePillar = (pillar: 'mercantil' | 'cdc' | 'services', field: string, value: number) => {
    const newData: OracleData = JSON.parse(JSON.stringify(data));
    if (field.includes('.')) {
      const [sub, subField] = field.split('.');
      (newData.store.pillars[pillar] as any)[sub][subField] = value;
    } else {
      (newData.store.pillars[pillar] as any)[field] = value;
    }
    onChange(newData);
  };

  const updateStoreOperational = (type: 'cards' | 'combos', field: string, value: number) => {
    const newData: OracleData = JSON.parse(JSON.stringify(data));
    (newData.store.pillars.operational[type] as any)[field] = value;
    onChange(newData);
  };

  const updateStorePeriod = (field: string, value: any) => {
    const newPeriod = JSON.parse(JSON.stringify(data.store.period));
    newPeriod[field] = value;
    onPeriodChangeRequest(newPeriod);
  };

  const addSeller = () => {
    const newSeller: Seller = {
      id: crypto.randomUUID(),
      name: '',
      pillars: {
        mercantil: { meta: 0, realized: 0, icm: 0, gap: 0 },
        cdc: { meta: 0, realized: 0, icm: 0, gap: 0 },
        services: { meta: 0, realized: 0, icm: 0, gap: 0 },
      },
      operational: {
        cards: { meta: 0, realized: 0 },
        combos: { meta: 0, realized: 0 },
      },
      score: 0,
      classification: '',
      isTripleCrown: false,
    };
    onChange({ ...data, sellers: [...data.sellers, newSeller] });
  };

  const removeSeller = (id: string) => {
    onChange({ ...data, sellers: data.sellers.filter(s => s.id !== id) });
  };

  const updateSeller = (id: string, field: string, value: any) => {
    const newData: OracleData = JSON.parse(JSON.stringify(data));
    const seller = newData.sellers.find(s => s.id === id);
    if (seller) {
      if (field.includes('.')) {
        const parts = field.split('.');
        let current: any = seller;
        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
      } else {
        (seller as any)[field] = value;
      }
    }
    onChange(newData);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Period & Store Info */}
      <section className="bg-white p-4 md:p-6 rounded-2xl border border-primary/10 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-lg md:text-xl font-bold text-primary flex items-center gap-2">
            <Calendar size={20} className="text-accent" /> Período e Unidade
          </h2>
          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-zinc-400">Configuração Estrutural</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-500">Nome da Loja</label>
            <input 
              className="w-full p-2 border rounded-lg text-sm bg-zinc-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={data.store.name}
              onChange={e => onChange({ ...data, store: { ...data.store, name: e.target.value } })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-500">Tipo de Período</label>
            <select 
              className="w-full p-2 border rounded-lg text-sm bg-zinc-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={data.store.period.type}
              onChange={e => updateStorePeriod('type', e.target.value as PeriodType)}
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="custom">Intervalo Personalizado</option>
            </select>
          </div>

          {data.store.period.type === 'daily' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Data</label>
              <input 
                type="date"
                className="w-full p-2 border rounded-lg text-sm bg-zinc-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={data.store.period.date}
                onChange={e => updateStorePeriod('date', e.target.value)}
              />
            </div>
          )}

          {(data.store.period.type === 'weekly' || data.store.period.type === 'custom') && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Início</label>
                <input 
                  type="date"
                  className="w-full p-2 border rounded-lg text-sm bg-zinc-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={data.store.period.startDate}
                  onChange={e => updateStorePeriod('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Fim</label>
                <input 
                  type="date"
                  className="w-full p-2 border rounded-lg text-sm bg-zinc-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={data.store.period.endDate}
                  onChange={e => updateStorePeriod('endDate', e.target.value)}
                />
              </div>
            </>
          )}

          {data.store.period.type === 'monthly' && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Mês</label>
                <select 
                  className="w-full p-2 border rounded-lg text-sm bg-zinc-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={data.store.period.month}
                  onChange={e => updateStorePeriod('month', Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Ano</label>
                <NumberInput 
                  value={data.store.period.year || new Date().getFullYear()}
                  onChange={val => updateStorePeriod('year', val)}
                  plain={true}
                />
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput 
            label="Dias Úteis Totais"
            value={data.store.period.businessDaysTotal}
            onChange={val => updateStorePeriod('businessDaysTotal', val)}
            plain={true}
          />
          <NumberInput 
            label="Dias Decorridos"
            value={data.store.period.businessDaysElapsed}
            onChange={val => updateStorePeriod('businessDaysElapsed', val)}
            plain={true}
          />
        </div>
      </section>

      {/* Store Pillars */}
      <section className="bg-white p-4 md:p-6 rounded-2xl border border-primary/10 shadow-sm space-y-6">
        <h2 className="text-lg md:text-xl font-bold text-primary border-b pb-4">Metas da Unidade</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['mercantil', 'cdc', 'services'] as const).map(p => (
            <div key={p} className="p-4 bg-zinc-50 rounded-xl space-y-4 border border-zinc-100">
              <h3 className="text-xs font-black uppercase tracking-tighter text-primary text-center border-b pb-2">
                {p === 'services' ? 'Serviços' : p}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput 
                  label="Meta (R$)"
                  value={data.store.pillars[p].meta}
                  onChange={val => updateStorePillar(p, 'meta', val)}
                />
                <NumberInput 
                  label="Realizado (R$)"
                  value={data.store.pillars[p].realized}
                  onChange={val => updateStorePillar(p, 'realized', val)}
                />
              </div>

              {p === 'cdc' && (
                <div className="pt-2 border-t border-zinc-200 grid grid-cols-2 gap-3">
                  <NumberInput 
                    label="Meta Part. (%)"
                    value={data.store.pillars.cdc.participation.meta}
                    onChange={val => updateStorePillar('cdc', 'participation.meta', val)}
                    percent={true}
                  />
                  <NumberInput 
                    label="Real Part. (%)"
                    value={data.store.pillars.cdc.participation.realized}
                    onChange={val => updateStorePillar('cdc', 'participation.realized', val)}
                    percent={true}
                  />
                </div>
              )}

              {p === 'services' && (
                <div className="pt-2 border-t border-zinc-200 grid grid-cols-2 gap-3">
                  <NumberInput 
                    label="Meta Efic. (%)"
                    value={data.store.pillars.services.efficiency.meta}
                    onChange={val => updateStorePillar('services', 'efficiency.meta', val)}
                    percent={true}
                  />
                  <NumberInput 
                    label="Real Efic. (%)"
                    value={data.store.pillars.services.efficiency.realized}
                    onChange={val => updateStorePillar('services', 'efficiency.realized', val)}
                    percent={true}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-4 bg-zinc-50 rounded-xl space-y-4 border border-zinc-100">
            <h3 className="text-xs font-black uppercase tracking-tighter text-primary text-center border-b pb-2 flex items-center justify-center gap-2">
              <CreditCard size={14} className="text-accent" /> Cartões
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput 
                label="Meta (Qtd)"
                value={data.store.pillars.operational.cards.meta}
                onChange={val => updateStoreOperational('cards', 'meta', val)}
              />
              <NumberInput 
                label="Realizado (Qtd)"
                value={data.store.pillars.operational.cards.realized}
                onChange={val => updateStoreOperational('cards', 'realized', val)}
              />
            </div>
          </div>
          <div className="p-4 bg-zinc-50 rounded-xl space-y-4 border border-zinc-100">
            <h3 className="text-xs font-black uppercase tracking-tighter text-primary text-center border-b pb-2 flex items-center justify-center gap-2">
              <Package size={14} className="text-accent" /> Combos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput 
                label="Meta (Qtd)"
                value={data.store.pillars.operational.combos.meta}
                onChange={val => updateStoreOperational('combos', 'meta', val)}
              />
              <NumberInput 
                label="Realizado (Qtd)"
                value={data.store.pillars.operational.combos.realized}
                onChange={val => updateStoreOperational('combos', 'realized', val)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sellers */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-primary">Time de Vendas</h2>
          <button 
            onClick={addSeller}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
          >
            <UserPlus size={14} className="text-accent" /> ADICIONAR VENDEDOR
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.sellers.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-primary flex justify-between items-center">
                <input 
                  className="bg-transparent text-white font-bold text-sm outline-none border-b border-white/20 focus:border-white w-full mr-4"
                  value={s.name}
                  onChange={e => updateSeller(s.id, 'name', e.target.value)}
                  placeholder="Nome do Vendedor"
                />
                <button 
                  onClick={() => removeSeller(s.id)}
                  className="text-white/40 hover:text-accent transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="p-4 space-y-4 flex-1">
                {(['mercantil', 'cdc', 'services'] as const).map(p => (
                  <div key={p} className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">
                      {p === 'services' ? 'Serviços' : p}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberInput 
                        label="Meta"
                        value={s.pillars[p].meta}
                        onChange={val => updateSeller(s.id, `pillars.${p}.meta`, val)}
                      />
                      <NumberInput 
                        label="Real"
                        value={s.pillars[p].realized}
                        onChange={val => updateSeller(s.id, `pillars.${p}.realized`, val)}
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-zinc-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center mb-2">Indicadores Operacionais</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[8px] font-bold uppercase text-zinc-400"><CreditCard size={10}/> Cartões</div>
                      <div className="grid grid-cols-2 gap-1">
                        <NumberInput 
                          placeholder="Meta"
                          value={s.operational.cards.meta}
                          onChange={val => updateSeller(s.id, 'operational.cards.meta', val)}
                        />
                        <NumberInput 
                          placeholder="Real"
                          value={s.operational.cards.realized}
                          onChange={val => updateSeller(s.id, 'operational.cards.realized', val)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[8px] font-bold uppercase text-zinc-400"><Package size={10}/> Combos</div>
                      <div className="grid grid-cols-2 gap-1">
                        <NumberInput 
                          placeholder="Meta"
                          value={s.operational.combos.meta}
                          onChange={val => updateSeller(s.id, 'operational.combos.meta', val)}
                        />
                        <NumberInput 
                          placeholder="Real"
                          value={s.operational.combos.realized}
                          onChange={val => updateSeller(s.id, 'operational.combos.realized', val)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
