
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

  const prompt = `
    Você é o Oráculo Comercial, um sistema de inteligência estratégica de alta performance.
    Analise os seguintes dados da loja ${data.store.name} para o período de ${getPeriodLabel()} e gere uma leitura executiva fria, técnica e direta.

    DADOS DA LOJA:
    - Saúde da Loja: ${data.store.healthIndex.toFixed(2)}% (${data.store.classification})
    - Tríplice Coroa: ${Object.values(data.store.tripleCrownStatus).every(v => v) ? 'Consolidada' : 'Pendente'}
    - Execução Operacional (Cartões/Combos): ${((data.store.pillars.operational.cards.achievement + data.store.pillars.operational.combos.achievement) / 2).toFixed(1)}%
    - Projeção Mensal: Mercantil ${data.projection.mercantilProjected.toFixed(1)}%, CDC ${data.projection.cdcProjected.toFixed(1)}%, Serviços ${data.projection.servicesProjected.toFixed(1)}%
    - Dependência: ${data.distribution.dependencyLevel} (Concentração Top 1: ${data.distribution.top1Contribution.toFixed(1)}%)
    - Maturidade do Time: ${data.maturityIndex.classification} (${data.maturityIndex.above100Percent.toFixed(1)}% acima de 100%)

    REGRAS DE ANÁLISE:
    1. Identifique se o cenário é de "Crescimento Saudável", "Risco de Concentração" ou "Erosão de Margem".
    2. Avalie o equilíbrio entre os pilares (Mercantil, CDC, Serviços).
    3. Analise se a execução operacional (Cartões/Combos) está acompanhando a saúde financeira.
    4. Projete o fechamento com base na tendência atual.

    REGRAS DE SAÍDA:
    1. Resumo Executivo (máximo 3 parágrafos).
    2. Regional Preview (foco em resultados e tendências).
    3. Blindagem Estratégica (ações preventivas imediatas).
    4. Ajuste Estrutural Recomendado (foco em pessoas e processos).
    5. Use tom profissional, técnico e direto. Sem motivação genérica.
    6. Formate em Markdown.
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
