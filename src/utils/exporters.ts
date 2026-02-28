
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { OracleResult } from '../types/oracle';
import { formatCurrencyBR } from './formatters';

export const exportToExcel = (data: OracleResult) => {
  const wb = XLSX.utils.book_new();
  
  // Store Sheet
  const storeData = [
    ["SISTEMA DE INTELIGÊNCIA COMERCIAL - ORÁCULO"],
    ["LOJA:", data.store.name],
    ["PERÍODO:", data.store.period.label],
    ["GERADO EM:", new Date().toLocaleString('pt-BR')],
    [],
    ["PILAR", "META", "REALIZADO", "ICM (%)", "GAP"],
    ["Mercantil", data.store.pillars.mercantil.meta, data.store.pillars.mercantil.realized, data.store.pillars.mercantil.icm, data.store.pillars.mercantil.gap],
    ["CDC", data.store.pillars.cdc.meta, data.store.pillars.cdc.realized, data.store.pillars.cdc.icm, data.store.pillars.cdc.gap],
    ["Serviços", data.store.pillars.services.meta, data.store.pillars.services.realized, data.store.pillars.services.icm, data.store.pillars.services.gap],
    [],
    ["SCORE DE SAÚDE:", data.intelligence?.healthScore.toFixed(1) + "%"],
    ["CLASSIFICAÇÃO:", data.store.classification],
    [],
    ["RADAR ESTRATÉGICO"],
    ["Pilar mais Forte:", data.intelligence?.radar.strongestPillar],
    ["Pilar mais Vulnerável:", data.intelligence?.radar.vulnerablePillar],
    ["Vendedor em Ascensão:", data.intelligence?.radar.risingSeller],
    ["Vendedor em Risco:", data.intelligence?.radar.riskySeller],
    ["Tendência Geral:", data.intelligence?.radar.generalTrend],
    ["Dispersão do Time:", data.intelligence?.radar.dispersionLevel],
  ];
  
  const wsStore = XLSX.utils.aoa_to_sheet(storeData);
  XLSX.utils.book_append_sheet(wb, wsStore, "Resumo Loja");

  // Sellers Sheet
  const sellersData = [
    ["RANK", "NOME", "MERCANTIL ICM", "CDC ICM", "SERVIÇOS ICM", "SCORE", "STATUS", "CONSISTÊNCIA", "TENDÊNCIA MERCANTIL", "TENDÊNCIA CDC", "TENDÊNCIA SERVIÇOS", "ALERTA DE RISCO"],
    ...data.sellers.sort((a, b) => b.score - a.score).map((s, idx) => [
      idx + 1,
      s.name,
      s.pillars.mercantil.icm.toFixed(1) + "%",
      s.pillars.cdc.icm.toFixed(1) + "%",
      s.pillars.services.icm.toFixed(1) + "%",
      s.score.toFixed(1) + "%",
      s.classification,
      (s.intelligence?.consistency.toFixed(0) || "0") + "%",
      s.intelligence?.trend.mercantil || "N/A",
      s.intelligence?.trend.cdc || "N/A",
      s.intelligence?.trend.services || "N/A",
      s.intelligence?.riskAlert || "Nenhum"
    ])
  ];
  
  const wsSellers = XLSX.utils.aoa_to_sheet(sellersData);
  XLSX.utils.book_append_sheet(wb, wsSellers, "Performance Individual");

  XLSX.writeFile(wb, `Oraculo_Comercial_${data.store.name}_${data.store.period.label.replace(/\//g, '-')}.xlsx`);
};

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const dataUrl = await toPng(element, { 
    backgroundColor: '#f8f9fa', 
    quality: 0.95,
    filter: (node: any) => {
      if (node.classList && node.classList.contains('no-export')) return false;
      return true;
    }
  });
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(dataUrl);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
};

export const exportToPNG = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const dataUrl = await toPng(element, { 
    backgroundColor: '#f8f9fa', 
    quality: 1,
    filter: (node: any) => {
      if (node.classList && node.classList.contains('no-export')) return false;
      return true;
    }
  });
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
};

export const generateWhatsAppText = (data: OracleResult) => {
  const { intelligence, store, sellers } = data;
  if (!intelligence) return "";

  const topSellers = [...sellers].sort((a, b) => b.score - a.score).slice(0, 3);
  
  let text = `🚀 *SISTEMA DE INTELIGÊNCIA COMERCIAL* 🚀\n`;
  text += `📍 *Loja:* ${store.name}\n`;
  text += `📅 *Período:* ${store.period.label}\n`;
  text += `⸻⸻⸻⸻⸻\n\n`;
  
  text += `📊 *SAÚDE DA OPERAÇÃO:* ${intelligence.healthScore.toFixed(1)}%\n`;
  text += `🏁 *Status:* ${store.classification}\n`;
  text += `📝 *Leitura:* ${intelligence.healthReading}\n\n`;
  
  text += `🎯 *RADAR ESTRATÉGICO:*\n`;
  text += `• Pilar Forte: ${intelligence.radar.strongestPillar}\n`;
  text += `• Pilar Vulnerável: ${intelligence.radar.vulnerablePillar}\n`;
  text += `• MVP: ${intelligence.radar.risingSeller}\n`;
  text += `• Risco: ${intelligence.radar.riskySeller}\n`;
  text += `• Tendência: ${intelligence.radar.generalTrend}\n\n`;
  
  text += `🏆 *TOP 3 PERFORMANCE:*\n`;
  topSellers.forEach((s, i) => {
    text += `${i + 1}º ${s.name} - ${s.score.toFixed(1)}%\n`;
  });
  
  text += `\n⚠️ *ALERTA:* ${intelligence.concentrationRisk}\n`;
  text += `⸻⸻⸻⸻⸻\n`;
  text += `_Gerado automaticamente pelo Oráculo Comercial_`;

  return encodeURIComponent(text);
};
