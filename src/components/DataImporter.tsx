
import React, { useState } from 'react';
import { OracleData, Seller } from '../types/oracle';
import { FileText, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  onImport: (newData: OracleData) => void;
  currentData: OracleData;
}

export const DataImporter: React.FC<Props> = ({ onImport, currentData }) => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const parseNumber = (val: string): number => {
    if (!val) return 0;
    // Remove currency symbols, spaces, and dots (thousands)
    // Replace comma with dot (decimal)
    const clean = val.replace(/[R$\s.]/g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleImport = () => {
    if (!text.trim()) return;

    try {
      const newData: OracleData = JSON.parse(JSON.stringify(currentData)); // Deep clone
      
      // Reset store values to 0 before parsing to ensure missing data is 0
      newData.store.pillars.mercantil.meta = 0;
      newData.store.pillars.mercantil.realized = 0;
      newData.store.pillars.cdc.meta = 0;
      newData.store.pillars.cdc.realized = 0;
      newData.store.pillars.services.meta = 0;
      newData.store.pillars.services.realized = 0;
      newData.store.pillars.operational.cards.meta = 0;
      newData.store.pillars.operational.cards.realized = 0;
      newData.store.pillars.operational.combos.meta = 0;
      newData.store.pillars.operational.combos.realized = 0;

      // Improved number extraction: captures numbers with dots and commas
      const extractNumbers = (str: string): number[] => {
        const matches = str.match(/[0-9]+(?:[.,][0-9]+)*/g) || [];
        return matches.map(m => parseNumber(m));
      };

      // 1. Process Store Block (Explicit Delimiters)
      const storeMatch = text.match(/\[LOJA_INICIO\]([\s\S]*?)\[LOJA_FIM\]/i);
      if (storeMatch) {
        const storeText = storeMatch[1];
        const storeLines = storeText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        storeLines.forEach(line => {
          const normalized = line.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          const nums = extractNumbers(line);
          if (nums.length === 0) return;

          const isMeta = normalized.includes('meta');
          const isReal = normalized.includes('real') || normalized.includes('atingido') || normalized.includes('realizado');

          const targetPillar = normalized.includes('mercantil') ? 'mercantil' :
                             normalized.includes('cdc') ? 'cdc' :
                             normalized.includes('servico') ? 'services' : null;

          if (targetPillar) {
            if (nums.length >= 2) {
              newData.store.pillars[targetPillar].meta = nums[0];
              newData.store.pillars[targetPillar].realized = nums[1];
            } else if (nums.length === 1) {
              if (isReal && !isMeta) newData.store.pillars[targetPillar].realized = nums[0];
              else newData.store.pillars[targetPillar].meta = nums[0];
            }
          } else {
            const isCards = normalized.includes('cartao') || normalized.includes('cartoes');
            const isCombos = normalized.includes('combo');
            
            if (isCards) {
              if (nums.length >= 2) {
                newData.store.pillars.operational.cards.meta = nums[0];
                newData.store.pillars.operational.cards.realized = nums[1];
              } else if (nums.length === 1) {
                if (isReal && !isMeta) newData.store.pillars.operational.cards.realized = nums[0];
                else newData.store.pillars.operational.cards.meta = nums[0];
              }
            } else if (isCombos) {
              if (nums.length >= 2) {
                newData.store.pillars.operational.combos.meta = nums[0];
                newData.store.pillars.operational.combos.realized = nums[1];
              } else if (nums.length === 1) {
                if (isReal && !isMeta) newData.store.pillars.operational.combos.realized = nums[0];
                else newData.store.pillars.operational.combos.meta = nums[0];
              }
            }
          }
        });
      }

      // 2. Process Sellers Block (Explicit Delimiters)
      const sellersMatch = text.match(/\[VENDEDORES_INICIO\]([\s\S]*?)\[VENDEDORES_FIM\]/i);
      if (sellersMatch) {
        const sellersText = sellersMatch[1];
        const sellerLines = sellersText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const sellers: Seller[] = [];
        let currentSeller: Seller | null = null;
        let sellerNumbers: number[] = [];

        sellerLines.forEach(line => {
          const nums = extractNumbers(line);
          
          if (nums.length === 0) {
            if (line.length > 2) {
              if (currentSeller) applyNumbersToSeller(currentSeller, sellerNumbers);
              currentSeller = createEmptySeller(line);
              sellerNumbers = [];
              sellers.push(currentSeller);
            }
          } else {
            const namePart = line.split(/[0-9]/)[0].trim();
            if (namePart.length > 2) {
              if (currentSeller) applyNumbersToSeller(currentSeller, sellerNumbers);
              currentSeller = createEmptySeller(namePart);
              sellerNumbers = nums;
              sellers.push(currentSeller);
            } else if (currentSeller) {
              sellerNumbers = [...sellerNumbers, ...nums];
            }
          }
        });

        if (currentSeller) applyNumbersToSeller(currentSeller, sellerNumbers);
        if (sellers.length > 0) newData.sellers = sellers;
      }

      onImport(newData);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Import error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const createEmptySeller = (name: string): Seller => ({
    id: crypto.randomUUID(),
    name: name,
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
  });

  const applyNumbersToSeller = (seller: Seller, numbers: number[]) => {
    seller.pillars.mercantil.meta = numbers[0] || 0;
    seller.pillars.mercantil.realized = numbers[1] || 0;
    seller.pillars.cdc.meta = numbers[2] || 0;
    seller.pillars.cdc.realized = numbers[3] || 0;
    seller.pillars.services.meta = numbers[4] || 0;
    seller.pillars.services.realized = numbers[5] || 0;
    seller.operational.cards.meta = numbers[6] || 0;
    seller.operational.cards.realized = numbers[7] || 0;
    seller.operational.combos.meta = numbers[8] || 0;
    seller.operational.combos.realized = numbers[9] || 0;
  };

  return (
    <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <Download size={18} className="text-zinc-400" />
        <h3 className="text-sm font-bold uppercase tracking-widest">Importar Dados</h3>
      </div>

      <p className="text-[10px] text-zinc-400 leading-relaxed uppercase font-bold">
        Cole o boletim textual abaixo. O sistema extrairá automaticamente as metas e realizados da loja e dos vendedores.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Cole o boletim aqui..."
        className="w-full h-48 bg-zinc-800 border border-white/5 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:ring-2 focus:ring-white/20 outline-none transition-all resize-none"
      />

      <button
        onClick={handleImport}
        disabled={!text.trim()}
        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          status === 'success' 
            ? 'bg-emerald-500 text-white' 
            : status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-50'
        }`}
      >
        {status === 'success' ? (
          <> <CheckCircle2 size={14} /> DADOS DISTRIBUÍDOS NO FORMULÁRIO </>
        ) : status === 'error' ? (
          <> <AlertCircle size={14} /> ERRO NA IMPORTAÇÃO </>
        ) : (
          <> <FileText size={14} /> PROCESSAR BOLETIM </>
        )}
      </button>

      <div className="pt-4 border-t border-white/5">
        <h4 className="text-[8px] font-black text-zinc-500 uppercase mb-2 tracking-widest">Dicas de Formato:</h4>
        <ul className="text-[8px] text-zinc-500 space-y-1 uppercase font-bold">
          <li>• Use blocos: [LOJA_INICIO] ... [LOJA_FIM]</li>
          <li>• Use blocos: [VENDEDORES_INICIO] ... [VENDEDORES_FIM]</li>
          <li>• Palavras-chave: Mercantil, CDC, Serviços, Cartões, Combos.</li>
          <li>• Vendedores: Nome seguido dos valores em sequência.</li>
        </ul>
      </div>
    </div>
  );
};
