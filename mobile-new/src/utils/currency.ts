/**
 * Formatea un número como moneda chilena (CLP)
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP`;
};

/**
 * Formatea un número como moneda sin el sufijo CLP (para uso en componentes pequeños)
 */
export const formatCurrencyShort = (amount: number): string => {
  return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

