import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Expense, Budget, Category } from '../models/expense.model';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

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
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  
  // Expose as observables
  expenses$ = this.expensesSubject.asObservable();
  totals$ = this.totalsSubject.asObservable();
  categories$ = this.categoriesSubject.asObservable();
  budgets$ = this.budgetsSubject.asObservable();
  
  private defaultCategories: Category[] = [
    { name: 'Food', color: '#FF6B6B', icon: '🍔', isDefault: true },
    { name: 'Transport', color: '#4ECDC4', icon: '🚌', isDefault: true },
    { name: 'Entertainment', color: '#FFD166', icon: '🎬', isDefault: true },
    { name: 'Shopping', color: '#118AB2', icon: '🛍️', isDefault: true },
    { name: 'Other', color: '#999999', icon: '📦', isDefault: true },
    { name: 'Income', color: '#06D6A0', icon: '💰', isDefault: true }
  ];
  
  private defaultBudgets: Budget[] = [
    { category: 'Food', limit: 300, spent: 0, color: '#FF6B6B', icon: '🍔' },
    { category: 'Transport', limit: 100, spent: 0, color: '#4ECDC4', icon: '🚌' },
    { category: 'Entertainment', limit: 150, spent: 0, color: '#FFD166', icon: '🎬' },
    { category: 'Shopping', limit: 200, spent: 0, color: '#118AB2', icon: '🛍️' },
    { category: 'Other', limit: 100, spent: 0, color: '#999999', icon: '📦' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadFromLocalStorage();
    this.updateSubjects();
  }

  // Category Management Methods
  getCategories(): Category[] {
    return [...this.categoriesSubject.value];
  }

  addCategory(category: Omit<Category, 'isDefault'>): void {
    const categories = this.getCategories();
    const newCategory: Category = { ...category, isDefault: false };
    
    // Check if category already exists
    if (!categories.find(c => c.name.toLowerCase() === category.name.toLowerCase())) {
      categories.push(newCategory);
      this.saveCategories(categories);
      this.addBudgetForCategory(newCategory);
    }
  }

  updateCategory(oldName: string, updatedCategory: Category): void {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.name === oldName);
    
    if (index !== -1) {
      categories[index] = updatedCategory;
      this.saveCategories(categories);
      
      // Update budget for this category
      this.updateBudgetCategory(oldName, updatedCategory);
    }
  }

  deleteCategory(categoryName: string): void {
    const categories = this.getCategories();
    const category = categories.find(c => c.name === categoryName);
    
    // Don't delete default categories
    if (category && !category.isDefault) {
      const filteredCategories = categories.filter(c => c.name !== categoryName);
      this.saveCategories(filteredCategories);
      
      // Remove budget for this category
      this.removeBudgetForCategory(categoryName);
    }
  }

  // Budget Management Methods
  getBudgets(): Budget[] {
    return [...this.budgetsSubject.value];
  }

  updateBudgetLimit(category: string, newLimit: number): void {
    const budgets = this.getBudgets();
    const budgetIndex = budgets.findIndex(b => b.category === category);
    
    if (budgetIndex !== -1) {
      budgets[budgetIndex].limit = newLimit;
      this.saveBudgets(budgets);
    } else {
      // Create new budget if doesn't exist
      const categoryObj = this.getCategories().find(c => c.name === category);
      if (categoryObj && category !== 'Income') {
        budgets.push({
          category,
          limit: newLimit,
          spent: 0,
          color: categoryObj.color,
          icon: categoryObj.icon
        });
        this.saveBudgets(budgets);
      }
    }
  }

  // Existing methods with updates
  addExpense(expense: Omit<Expense, 'id'>): void {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString()
    };
    
    this.expenses.push(newExpense);
    
    // Update budget if it's an expense
    if (expense.type === 'expense') {
      this.updateBudgetSpending(expense.category, expense.amount);
    }
    
    this.saveToLocalStorage();
    this.updateSubjects();
  }

  deleteExpense(id: string): void {
    const index = this.expenses.findIndex(exp => exp.id === id);
    if (index !== -1) {
      const expense = this.expenses[index];
      // Remove from budget if it's an expense
      if (expense.type === 'expense') {
        this.updateBudgetSpending(expense.category, -expense.amount);
      }
      this.expenses.splice(index, 1);
      this.saveToLocalStorage();
      this.updateSubjects();
    }
  }

  // Private helper methods
  private addBudgetForCategory(category: Category): void {
    if (category.name === 'Income') return;
    
    const budgets = this.getBudgets();
    const existingBudget = budgets.find(b => b.category === category.name);
    
    if (!existingBudget) {
      budgets.push({
        category: category.name,
        limit: 200, // Default limit for new categories
        spent: 0,
        color: category.color,
        icon: category.icon
      });
      this.saveBudgets(budgets);
    }
  }

  private updateBudgetCategory(oldName: string, category: Category): void {
    const budgets = this.getBudgets();
    const budgetIndex = budgets.findIndex(b => b.category === oldName);
    
    if (budgetIndex !== -1) {
      budgets[budgetIndex].category = category.name;
      budgets[budgetIndex].color = category.color;
      budgets[budgetIndex].icon = category.icon;
      this.saveBudgets(budgets);
    }
  }

  private removeBudgetForCategory(categoryName: string): void {
    const budgets = this.getBudgets();
    const filteredBudgets = budgets.filter(b => b.category !== categoryName);
    this.saveBudgets(filteredBudgets);
  }

  private updateBudgetSpending(category: string, amount: number): void {
    const budgets = this.getBudgets();
    const budget = budgets.find(b => b.category === category);
    if (budget) {
      budget.spent += amount;
      this.saveBudgets(budgets);
    }
  }

  // Local storage methods
  private saveCategories(categories: Category[]): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('categories', JSON.stringify(categories));
      this.categoriesSubject.next(categories);
    }
  }

  private saveBudgets(budgets: Budget[]): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('budgets', JSON.stringify(budgets));
      this.budgetsSubject.next(budgets);
    }
  }

  private saveToLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }
  }

  private loadFromLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Load expenses
      const storedExpenses = localStorage.getItem('expenses');
      if (storedExpenses) {
        this.expenses = JSON.parse(storedExpenses);
      }
      
      // Load categories (combine with defaults if none saved)
      const storedCategories = localStorage.getItem('categories');
      let categories = this.defaultCategories;
      if (storedCategories) {
        const userCategories = JSON.parse(storedCategories);
        // Merge defaults with user categories, avoiding duplicates
        const defaultNames = this.defaultCategories.map(c => c.name.toLowerCase());
        const uniqueUserCategories = userCategories.filter((c: Category) => 
          !defaultNames.includes(c.name.toLowerCase())
        );
        categories = [...this.defaultCategories, ...uniqueUserCategories];
      }
      this.categoriesSubject.next(categories);
      
      // Load budgets
      const storedBudgets = localStorage.getItem('budgets');
      let budgets = this.defaultBudgets;
      if (storedBudgets) {
        budgets = JSON.parse(storedBudgets);
      } else {
        // Recalculate budget spending
        budgets.forEach(budget => budget.spent = 0);
        this.expenses.forEach(expense => {
          if (expense.type === 'expense') {
            const budget = budgets.find(b => b.category === expense.category);
            if (budget) {
              budget.spent += expense.amount;
            }
          }
        });
      }
      this.budgetsSubject.next(budgets);
    }
  }

  private updateSubjects(): void {
    this.expensesSubject.next([...this.expenses]);
    
    const totals = {
      income: this.getTotalIncome(),
      expenses: this.getTotalExpenses(),
      balance: this.getBalance()
    };
    this.totalsSubject.next(totals);
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
  // Add this method in the ExpenseService class:
getExpenses(): Expense[] {
  return [...this.expenses];
}


}