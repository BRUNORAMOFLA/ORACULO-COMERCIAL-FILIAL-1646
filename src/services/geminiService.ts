import { OracleData } from "../types/oracle";

export async function generateExecutiveAnalysis(data: OracleData) {
  const getPeriodLabel = () => {
    const { period } = data.store;
    if (period.type === "daily") return period.date;
    if (period.type === "monthly")
      return `${new Date(0, (period.month || 1) - 1).toLocaleString(
        "pt-BR",
        { month: "long" }
      )} / ${period.year}`;
    if (period.startDate && period.endDate)
      return `${period.startDate} a ${period.endDate}`;
    return "Período não definido";
  };

  const prompt = `
Você é o Oráculo Comercial...
Analise os seguintes dados da loja ${data.store.name} para o período de ${getPeriodLabel()}...

(cole aqui exatamente o mesmo prompt que você já tem)
`;

  const response = await fetch("/api/analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const result = await response.json();

  return result.result;
}      ],
      temperature: 0.6,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Erro ao gerar análise:", error);
    return "Erro ao processar análise estratégica.";
  }
}
