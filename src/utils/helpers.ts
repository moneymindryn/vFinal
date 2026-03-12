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
