
import React from 'react';
import { OracleResult } from '../../types/oracle';
import { ComparisonResult } from '../../types/intelligence';
import { 
  FileSpreadsheet, 
  FileText, 
  MessageSquare, 
  Download 
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exporters';

interface Props {
  data: OracleResult;
  comparison: ComparisonResult;
}

export const ExportButtons: React.FC<Props> = ({ data, comparison }) => {
  const filename = `Evolucao_${data.store.name}_${comparison.periodB}_vs_${comparison.periodA}`;

  const copyWhatsAppText = () => {
    const text = `🚀 *RELATÓRIO DE EVOLUÇÃO ESTRATÉGICA* 🚀\n` +
      `📍 *Loja:* ${data.store.name}\n` +
      `📅 *Comparativo:* ${comparison.periodB} vs ${comparison.periodA}\n` +
      `⸻⸻⸻⸻⸻\n\n` +
      `📊 *STATUS:* ${comparison.store.classification.toUpperCase()}\n` +
      `📈 *VARIAÇÃO SCORE:* ${comparison.store.deltaScore >= 0 ? '+' : ''}${comparison.store.deltaScore.toFixed(1)} pts\n\n` +
      `📝 *RESUMO:* ${comparison.executiveSummary}\n\n` +
      `⚠️ *ALERTAS:* ${comparison.alerts.length} identificados.\n` +
      `⸻⸻⸻⸻⸻\n` +
      `_Gerado automaticamente pelo Oráculo Comercial_`;

    navigator.clipboard.writeText(text);
    alert('Texto copiado para o WhatsApp!');
  };

  return (
    <div className="flex flex-wrap gap-4 no-export">
      <button 
        onClick={() => exportToPDF('evolution-report', filename)}
        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
      >
        <FileText size={16} /> BAIXAR PDF COMPARATIVO
      </button>

      <button 
        onClick={() => exportToExcel(data)}
        className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 border border-zinc-200 rounded-2xl text-xs font-bold hover:bg-zinc-50 transition-all"
      >
        <FileSpreadsheet size={16} className="text-emerald-600" /> EXPORTAR XLSX
      </button>

      <button 
        onClick={copyWhatsAppText}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-bold hover:bg-emerald-100 transition-all"
      >
        <MessageSquare size={16} /> WHATSAPP EXECUTIVO
      </button>
    </div>
  );
};
