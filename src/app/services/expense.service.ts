import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Expense, Budget, Category } from '../models/expense.model';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs'; // Add this

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private expenses: Expense[] = [];
  
  // Create BehaviorSubjects for reactive updates
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  private totalsSubject = new BehaviorSubject<{income: number, expenses: number, balance: number}>({
    income: 0,
    expenses: 0,
    balance: 0
  });
  
  // Expose as observables
  expenses$ = this.expensesSubject.asObservable();
  totals$ = this.totalsSubject.asObservable();
  
  private budgets: Budget[] = [
    { category: 'Food', limit: 300, spent: 0 },
    { category: 'Transport', limit: 100, spent: 0 },
    { category: 'Entertainment', limit: 150, spent: 0 },
    { category: 'Books', limit: 200, spent: 0 },
    { category: 'Other', limit: 100, spent: 0 }
  ];

  private categories: Category[] = [
    { name: 'Food', color: '#FF6B6B', icon: '🍔' },
    { name: 'Transport', color: '#4ECDC4', icon: '🚌' },
    { name: 'Entertainment', color: '#FFD166', icon: '🎬' },
    { name: 'Books', color: '#06D6A0', icon: '📚' },
    { name: 'Other', color: '#118AB2', icon: '📦' },
    { name: 'Income', color: '#073B4C', icon: '💰' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadFromLocalStorage();
    this.updateSubjects(); // Initialize subjects
  }

  getExpenses(): Expense[] {
    return [...this.expenses];
  }

  getBudgets(): Budget[] {
    return [...this.budgets];
  }

  getCategories(): Category[] {
    return [...this.categories];
  }

  addExpense(expense: Omit<Expense, 'id'>): void {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString()
    };
    
    this.expenses.push(newExpense);
    
    // Update budget if it's an expense
    if (expense.type === 'expense') {
      this.updateBudget(expense.category, expense.amount);
    }
    
    this.saveToLocalStorage();
    this.updateSubjects(); // Update reactive subjects
  }

  deleteExpense(id: string): void {
    const index = this.expenses.findIndex(exp => exp.id === id);
    if (index !== -1) {
      const expense = this.expenses[index];
      // Remove from budget if it's an expense
      if (expense.type === 'expense') {
        this.updateBudget(expense.category, -expense.amount);
      }
      this.expenses.splice(index, 1);
      this.saveToLocalStorage();
      this.updateSubjects(); // Update reactive subjects
    }
  }

  getTotalExpenses(): number {
    return this.expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, expense) => sum + expense.amount, 0);
  }

  getTotalIncome(): number {
    return this.expenses
      .filter(e => e.type === 'income')
      .reduce((sum, expense) => sum + expense.amount, 0);
  }

  getBalance(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }

  private updateBudget(category: string, amount: number): void {
    const budget = this.budgets.find(b => b.category === category);
    if (budget) {
      budget.spent += amount;
    }
  }

  private saveToLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('expenses', JSON.stringify(this.expenses));
      localStorage.setItem('budgets', JSON.stringify(this.budgets));
    }
  }

  private loadFromLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedExpenses = localStorage.getItem('expenses');
      const storedBudgets = localStorage.getItem('budgets');
      
      if (storedExpenses) {
        this.expenses = JSON.parse(storedExpenses);
      }
      
      if (storedBudgets) {
        this.budgets = JSON.parse(storedBudgets);
      } else {
        // Recalculate budget spending
        this.budgets.forEach(budget => budget.spent = 0);
        this.expenses.forEach(expense => {
          if (expense.type === 'expense') {
            this.updateBudget(expense.category, expense.amount);
          }
        });
      }
    }
  }

  // New method to update reactive subjects
  private updateSubjects(): void {
    this.expensesSubject.next([...this.expenses]);
    
    const totals = {
      income: this.getTotalIncome(),
      expenses: this.getTotalExpenses(),
      balance: this.getBalance()
    };
    this.totalsSubject.next(totals);
  }
}