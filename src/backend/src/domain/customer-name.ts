import { invalid } from './errors.js';

export const MAX_CUSTOMER_NAME_LENGTH = 40;

/**
 * "¿A nombre de quién?" is the only personal data the MVP asks for (03 · Pago).
 * It is what the counter calls out, so it must be present and short.
 */
export function normalizeCustomerName(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw invalid('Falta el nombre para el pedido.');
  }
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length === 0) {
    throw invalid('Falta el nombre para el pedido.');
  }
  if (name.length > MAX_CUSTOMER_NAME_LENGTH) {
    throw invalid(`El nombre puede tener hasta ${MAX_CUSTOMER_NAME_LENGTH} caracteres.`);
  }
  return name;
}
