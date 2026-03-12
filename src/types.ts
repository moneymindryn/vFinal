import { Timestamp } from 'firebase/firestore';

export interface ProductVariant {
  id: string;
  name: string;
  regularPrice: number;
  salePrice: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  regularPrice: number;
  salePrice: number;
  categories: string[];
  featured: boolean;
  banner: boolean;
  rating: number;
  reviewCount: number;
  variants?: ProductVariant[];
  freeLink?: string;
  createdAt: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface AppSettings {
  whatsappNumber: string;
  email: string;
  location: string;
  facebookPage: string;
  paymentNumber: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  reviewText: string;
  createdAt: Timestamp;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
  selectedVariant?: ProductVariant;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  profilePic?: string;
  phoneNumber?: string;
  role: 'admin' | 'user';
  totalSpent?: number;
  createdAt: Timestamp;
}

export interface Order {
  id: string;
  trackingNumber: string;
  userId: string;
  customerName: string;
  customerGmail: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: string;
  transactionId: string;
  status: 'Pending' | 'Complete' | 'Reject';
  items: {
    productId: string;
    title: string;
    quantity: number;
    price: number;
    variantName?: string;
  }[];
  createdAt: Timestamp;
}
