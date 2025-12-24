export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  type: 'expense' | 'income';
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
  color: string;
  icon: string;
}

export interface Category {
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
} 