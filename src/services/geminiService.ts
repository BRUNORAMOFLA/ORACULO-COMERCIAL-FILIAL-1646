
import { GoogleGenAI } from "@google/genai";
import { OracleData } from "../types/oracle";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateExecutiveAnalysis(data: OracleData) {
  const getPeriodLabel = () => {
    const { period } = data.store;
    if (period.type === 'daily') return period.date;
    if (period.type === 'monthly') return `${new Date(0, (period.month || 1) - 1).toLocaleString('pt-BR', { month: 'long' })} / ${period.year}`;
    if (period.startDate && period.endDate) return `${period.startDate} a ${period.endDate}`;
    return 'Período não definido';
  };

  const EXCLUDED_SELLER = 'Caio';
  const filteredSellers = data.sellers.filter(s => s.name?.toLowerCase() !== EXCLUDED_SELLER.toLowerCase());
  const topSeller = [...filteredSellers].sort((a, b) => b.score - a.score)[0];
  const sellersBelow80 = filteredSellers.filter(s => s.score < 80).length;
  const sellersBelow100 = filteredSellers.filter(s => s.score < 100).length;
  const totalSellers = filteredSellers.length;

  const prompt = `
    Você é o Oráculo Comercial, um sistema de inteligência estratégica de alta performance.
    Sua missão é realizar uma leitura cirúrgica, numérica e fria da operação da loja ${data.store.name} para o período de ${getPeriodLabel()}.

    DADOS TÉCNICOS DA OPERAÇÃO:
    - Saúde Global: ${data.store.healthIndex.toFixed(2)}% (${data.store.classification})
    - Pilar Mercantil: ICM ${data.store.pillars.mercantil.icm.toFixed(1)}% | Meta: R$ ${data.store.pillars.mercantil.meta.toLocaleString('pt-BR')} | Real: R$ ${data.store.pillars.mercantil.realized.toLocaleString('pt-BR')} | Gap: R$ ${data.store.pillars.mercantil.gap.toLocaleString('pt-BR')}
    - Pilar CDC: ICM ${data.store.pillars.cdc.icm.toFixed(1)}% | Meta: R$ ${data.store.pillars.cdc.meta.toLocaleString('pt-BR')} | Real: R$ ${data.store.pillars.cdc.realized.toLocaleString('pt-BR')} | Gap: R$ ${data.store.pillars.cdc.gap.toLocaleString('pt-BR')}
    - Pilar Serviços: ICM ${data.store.pillars.services.icm.toFixed(1)}% | Meta: R$ ${data.store.pillars.services.meta.toLocaleString('pt-BR')} | Real: R$ ${data.store.pillars.services.realized.toLocaleString('pt-BR')} | Gap: R$ ${data.store.pillars.services.gap.toLocaleString('pt-BR')}
    - Execução Operacional: Cartões ${data.store.pillars.operational.cards.achievement.toFixed(1)}% | Combos ${data.store.pillars.operational.combos.achievement.toFixed(1)}%
    
    DADOS DO TIME E DISPERSÃO:
    - Top 1 Nominal: ${topSeller?.name || 'N/A'} (Score: ${topSeller?.score.toFixed(1)}%)
    - Concentração Top 1: ${data.distribution.top1Contribution.toFixed(1)}% do resultado total.
    - Nível de Dependência: ${data.distribution.dependencyLevel}
    - Maturidade: ${data.maturityIndex.classification}
    - Distribuição: ${sellersBelow80} vendedores abaixo de 80% | ${sellersBelow100} vendedores abaixo de 100% (Total: ${totalSellers})
    - Dispersão: ${data.intelligence?.radar.dispersionLevel || 'Não calculada'}

    PROJEÇÃO E TENDÊNCIA:
    - Probabilidade de Fechamento: ${data.projection.probability}
    - Tendência Projetada: Mercantil ${data.projection.mercantilProjected.toFixed(1)}%, CDC ${data.projection.cdcProjected.toFixed(1)}%, Serviços ${data.projection.servicesProjected.toFixed(1)}%

    REGRAS DE OURO PARA A ANÁLISE:
    1. Seja cirúrgico e numérico. Use números absolutos e gaps em R$.
    2. Conecte a análise ao time citando o Top 1 e a dispersão.
    3. Use tom profissional, técnico e frio. Linguagem de gestão executiva.
    4. Use emojis estratégicos apenas nos títulos dos blocos.
    5. Separe os blocos com linhas divisórias (---).
    6. Classifique o cenário obrigatoriamente como: 🔴 RISCO ESTRUTURAL, 🟡 RISCO MODERADO ou 🟢 CRESCIMENTO SUSTENTÁVEL.

    ESTRUTURA OBRIGATÓRIA DA RESPOSTA:
    1. CLASSIFICAÇÃO DO CENÁRIO
    ---
    2. RESUMO EXECUTIVO NUMÉRICO
    ---
    3. LEITURA DOS PILARES (Mercantil, CDC, Serviços)
    ---
    4. IMPACTO DO TIME E DISPERSÃO
    ---
    5. RISCO ESTRUTURAL E CONSISTÊNCIA
    ---
    6. PROJEÇÃO DE FECHAMENTO
    ---
    7. BLINDAGEM ESTRATÉGICA
    ---
    8. AJUSTE ESTRUTURAL

    Gere a análise agora seguindo rigorosamente estas instruções.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao gerar análise:", error);
    return "Erro ao processar análise estratégica.";
  }
}
