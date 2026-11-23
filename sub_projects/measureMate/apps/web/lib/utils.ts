import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export function formatDateTime(iso: string, locale?: string) {
  return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function titleCase(s: string) {
  return s.toLowerCase().split(/[_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function statusTone(s: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (s === 'CANCELLED') return 'danger';
  if (s === 'DELIVERED' || s === 'CLOSED' || s === 'READY_FOR_DELIVERY') return 'success';
  if (s === 'DRAFT') return 'neutral';
  return 'warning';
}
