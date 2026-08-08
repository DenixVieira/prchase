/**
 * Remove caracteres inválidos em nomes de arquivo/diretório (Windows e Linux),
 * preservando o texto legível — usado tanto no nome da organização (segmento
 * de diretório) quanto no nome de exibição da nota fiscal.
 */
export function sanitizeFileNameSegment(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 150) || "arquivo";
}

export function formatCurrencyBRL(value: string | number): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numeric || 0);
}

/** Nome de exibição da nota fiscal, ex.: "Computador - R$ 1.500,00" (sem extensão). */
export function buildInvoiceBaseFileName(category: string, estimatedValue: string): string {
  return sanitizeFileNameSegment(`${category} - ${formatCurrencyBRL(estimatedValue)}`);
}
