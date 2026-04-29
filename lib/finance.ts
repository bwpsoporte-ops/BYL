import type { UserPayload } from './auth';

export const CATEGORIES = [
  'Comida',
  'Transporte',
  'Casa',
  'Universidad',
  'Carro',
  'Salud',
  'Deudas',
  'Tarjeta',
  'Entretenimiento',
  'Restaurantes',
  'Servicios del hogar',
  'Supermercado',
  'Ropa',
  'Educacion',
  'Emergencias',
  'Otro',
];

export const PAYMENT_METHODS = ['Efectivo', 'Tarjeta de debito', 'Tarjeta de credito', 'Transferencia', 'Banco', 'Otro'];
export const VISIBILITIES = ['PRIVATE', 'SHARED'] as const;

export const BANK_PRESETS = [
  { name: 'BAC', accent: '#c4161c' },
  { name: 'Ficohsa', accent: '#006747' },
  { name: 'Atlántida', accent: '#004b8d' },
  { name: 'Banpais', accent: '#154734' },
  { name: 'Davivienda', accent: '#ed1c24' },
  { name: 'Occidente', accent: '#1f4f82' },
  { name: 'Promerica', accent: '#005baa' },
  { name: 'Lafise', accent: '#00843d' },
  { name: 'Otro', accent: '#102a4c' },
];

export function bankAccent(bank: string | null | undefined) {
  return BANK_PRESETS.find((item) => item.name.toLowerCase() === String(bank || '').toLowerCase())?.accent ?? '#102a4c';
}

export function money(value: number | string | null | undefined) {
  return Number(value || 0);
}

export function formatLempiras(value: number | string | null | undefined) {
  return `L ${money(value).toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function currentPeriod() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function coupleScopeId(session: UserPayload) {
  return session.coupleId || session.id;
}

export function splitShares(splitType: string | null | undefined, customOwnerShare?: number) {
  if (splitType === '70/30') return { owner: 70, partner: 30 };
  if (splitType === '30/70') return { owner: 30, partner: 70 };
  if (splitType === 'CUSTOM') {
    const owner = Math.max(0, Math.min(100, customOwnerShare ?? 50));
    return { owner, partner: 100 - owner };
  }
  return { owner: 50, partner: 50 };
}

export function monthsRemaining(targetDate: string | Date) {
  const today = new Date();
  const target = new Date(targetDate);
  return Math.max(0, (target.getFullYear() - today.getFullYear()) * 12 + target.getMonth() - today.getMonth());
}
