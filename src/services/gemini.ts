
import { GoogleGenAI, Type } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateStrategicDiagnosis = async (prompt: string) => {
  try {
    const model = "gemini-3-flash-preview";
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Você é o motor de Diagnóstico Estratégico do Oráculo Comercial. 
Sua função é analisar dois períodos (Base A vs Atual B) e gerar um diagnóstico técnico + provocativo, com foco em execução comercial.

Você deve gerar o diagnóstico em 6 blocos obrigatórios:
1) STATUS DO CICLO
2) LEITURA ESTRATÉGICA DA UNIDADE
3) ESTRUTURA DO TIME
4) PONTO DE PRESSÃO
5) AÇÃO IMEDIATA
6) FRASE FINAL

Tom: técnico, estratégico e provocativo. Sem emojis. Sem floreios. Sem narrativa motivacional vazia. 
Fundamente sempre nos números recebidos.`,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Erro ao gerar diagnóstico:", error);
    return "Erro ao processar o diagnóstico estratégico. Verifique sua conexão ou tente novamente mais tarde.";
  }
};

export const generateHistoryAnalysis = async (prompt: string) => {
  try {
    const model = "gemini-3-flash-preview";
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: `Você é o Motor Avançado de Inteligência do Histórico Global do Oráculo Comercial.
Sua função é interpretar TODOS os meses lançados no sistema e gerar um diagnóstico estratégico completo.

Você deve retornar um objeto JSON seguindo rigorosamente o esquema definido.

REGRAS DE CLASSIFICAÇÃO DO CICLO:
Se score_atual < 75 → classificacao_ciclo = "Instável"
Se score_atual entre 75 e 85 → "Em Recuperação"
Se score_atual entre 85 e 95 → "Sustentável"
Se score_atual > 95 → "Em Expansão"

REGRAS DE NÍVEL DE ALERTA:
Se score_atual < 75 → nivel_alerta = "critico"
Se score_atual entre 75 e 85 → "atencao"
Se score_atual > 85 → "saudavel"

ÍNDICE DE RISCO ESTRUTURAL (0 a 100):
Basear em: Dependência acima de 40% aumenta risco; Pilar abaixo de 85% aumenta risco; Alta volatilidade entre ciclos aumenta risco.

ÍNDICE DE CONSISTÊNCIA (0 a 100):
Calcular com base na variação entre os scores dos ciclos. Alta oscilação = baixa consistência.

PROJEÇÃO PRÓXIMO CICLO:
Estimar tendência com base na direção dos dois últimos ciclos. Não inventar crescimento artificial.

REGRAS DA ANÁLISE INTERNA:
- Linguagem técnica e analítica. Identificar causa estrutural. Relacionar dependência com risco. Comparar ciclos. Sem emojis.

REGRAS DA ANÁLISE EXECUTIVA:
- Linguagem direta e estratégica. Frases curtas. Foco em decisão. 1 causa principal clara. 1 ação imediata clara.

Regras Gerais:
- Basear-se apenas nos dados enviados. Não inventar números.
- Não repetir texto entre interno e executivo.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classificacao_ciclo: { type: Type.STRING },
            nivel_alerta: { type: Type.STRING, enum: ["critico", "atencao", "saudavel"] },
            score_atual: { type: Type.NUMBER },
            dependencia_atual: { type: Type.NUMBER },
            indice_risco_estrutural: { type: Type.NUMBER },
            indice_consistencia: { type: Type.NUMBER },
            projecao_proximo_ciclo: { type: Type.NUMBER },
            interno: {
              type: Type.OBJECT,
              properties: {
                status_ciclo: { type: Type.STRING },
                tendencia_score: { type: Type.STRING },
                raio_x_pilares: { type: Type.STRING },
                evolucao_dependencia: { type: Type.STRING },
                maturidade_operacional: { type: Type.STRING },
                conclusao_estrategica: { type: Type.STRING },
                frase_final: { type: Type.STRING }
              },
              required: ["status_ciclo", "tendencia_score", "raio_x_pilares", "evolucao_dependencia", "maturidade_operacional", "conclusao_estrategica", "frase_final"]
            },
            executivo: {
              type: Type.OBJECT,
              properties: {
                situacao: { type: Type.STRING },
                causa_principal: { type: Type.STRING },
                risco: { type: Type.STRING },
                acao_imediata: { type: Type.STRING },
                frase_final: { type: Type.STRING }
              },
              required: ["situacao", "causa_principal", "risco", "acao_imediata", "frase_final"]
            }
          },
          required: ["classificacao_ciclo", "nivel_alerta", "score_atual", "dependencia_atual", "indice_risco_estrutural", "indice_consistencia", "projecao_proximo_ciclo", "interno", "executivo"]
        },
        temperature: 0.7,
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro ao gerar análise histórica:", error);
    throw error;
  }
};
