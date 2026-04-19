export type UserRole = 'student' | 'teacher' | 'staff' | 'seller' | 'admin' | null;
export type View = 'landing' | 'join' | 'login' | 'register' | 'dashboard' | 'history' | 'menu-list' | 'manage-menu';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'order' | 'task';
  is_read: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  class_name?: string;
  balance: number;
}

export interface Habit {
  id: number;
  title: string;
  is_completed: boolean;
  streak_count: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  class_name?: string;
}

export interface Transaction {
  id: number;
  product_name: string;
  price: number;
  vendor: string;
  status: string;
  created_at: string;
  customer_name?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  seller_id: number;
}

export interface SellerPaymentMethod {
  id: number;
  seller_id: number;
  provider_name: string; // e.g., 'Bank BCA', 'DANA', 'OVO'
  account_name: string;
  account_number: string;
  type: 'bank' | 'e-wallet';
  qr_url?: string;
}

export interface Expense {
  id: number;
  item_name: string;
  amount: number;
  category: string;
  payment_method: string;
  created_at: string;
}
