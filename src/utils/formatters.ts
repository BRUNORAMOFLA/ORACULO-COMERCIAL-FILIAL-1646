
/**
 * Formats a number to Brazilian standard (dot as thousands separator)
 */
export function formatNumberBR(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return Math.round(value).toLocaleString('pt-BR');
}

/**
 * Formats a currency value to Brazilian standard
 */
export function formatCurrencyBR(value: number, showSymbol: boolean = true): string {
  if (value === undefined || value === null || isNaN(value)) return showSymbol ? "R$ 0" : "0";
  const formatted = Math.round(value).toLocaleString('pt-BR');
  return showSymbol ? `R$ ${formatted}` : formatted;
}

/**
 * Formats a date to Brazilian standard dd/MM/yyyy HH:mm:ss
 */
export function formatDateTimeBR(isoString: string): string {
  if (!isoString) return "Data indisponível";
  try {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    return "Data inválida";
  }
}

/**
 * Generates a label for the period based on its type and values
 */
export function generatePeriodLabel(period: any): string {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  try {
    switch (period.type) {
      case 'daily':
        if (!period.date) return "Data não informada";
        const [y, m, d] = period.date.split('-');
        return `${d}/${m}/${y}`;
      case 'monthly':
        const monthName = months[(period.month || 1) - 1] || "Mês";
        const year = period.year || new Date().getFullYear();
        return `${monthName}/${year}`;
      case 'weekly':
      case 'custom':
        if (!period.startDate || !period.endDate) return "Intervalo não informado";
        const [sy, sm, sd] = period.startDate.split('-');
        const [ey, em, ed] = period.endDate.split('-');
        return `${sd}/${sm}/${sy} a ${ed}/${em}/${ey}`;
      default:
        return "Período não definido";
    }
  } catch (e) {
    return "Erro no período";
  }
}
