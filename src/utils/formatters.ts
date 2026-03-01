
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
 * Calculates the ISO 8601 week number for a given date.
 * Following ISO 8601: Week starts on Monday, Week 1 is the week with the first Thursday.
 */
export function getISOWeek(date: Date): number {
  // Create a copy and work in UTC to avoid DST issues
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - day number (Monday = 1, Sunday = 7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
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
        if (!period.startDate || !period.endDate) return "Intervalo não informado";
        // Parse YYYY-MM-DD to avoid timezone shifts
        const [wsy, wsm, wsd] = period.startDate.split('-').map(Number);
        const startDateObj = new Date(wsy, wsm - 1, wsd);
        
        const weekNumber = getISOWeek(startDateObj);
        const [wey, wem, wed] = period.endDate.split('-');
        
        // Format as DD/MM/YYYY for the label
        const startFormatted = `${wsd.toString().padStart(2, '0')}/${wsm.toString().padStart(2, '0')}/${wsy}`;
        const endFormatted = `${wed}/${wem}/${wey}`;
        
        return `Semana ${weekNumber.toString().padStart(2, '0')} – ${startFormatted} a ${endFormatted}`;
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
