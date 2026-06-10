export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts
    }).format(new Date(date));
  } catch {
    return '';
  }
}

function getCurrencySymbol(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CURRENCY_SYMBOL) {
    return process.env.NEXT_PUBLIC_CURRENCY_SYMBOL;
  }
  return '$';
}

export function formatCurrency(amount: number | string, symbol?: string): string {
  const s = symbol ?? getCurrencySymbol();
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return `${s}0.00`;
  return `${s}${n.toFixed(2)}`;
}
