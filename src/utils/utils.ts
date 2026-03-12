import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return `৳${price.toLocaleString()}`;
}

export function generateOrderId() {
  return `PM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export function generateTrackingNumber() {
  return `Pixi-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export function formatDate(date: any) {
  if (!date) return 'N/A';
  const d = date.toDate ? date.toDate() : new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
}
