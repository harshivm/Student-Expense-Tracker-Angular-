import { Component } from '@angular/core';
import { ExpenseService } from '../services/expense.service';
import { Expense, Category } from '../models/expense.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs'; // Add this
@Component({
  selector: 'app-analytics',
  imports: [FormsModule, CommonModule], // Add this
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics {
 expenses: Expense[] = [];
  categories: Category[] = [];
  categoryTotals: {category: string, total: number, percentage: number}[] = [];
private subscription!: Subscription; // Add this

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.expenses = this.expenseService.getExpenses();
    this.categories = this.expenseService.getCategories();
    this.calculateCategoryTotals();

    // Subscribe to expense updates
    this.subscription = this.expenseService.expenses$.subscribe(expenses => {
      this.expenses = expenses;
      this.calculateCategoryTotals();
    });
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  calculateCategoryTotals(): void {
    const categoryMap = new Map<string, number>();
    const totalExpenses = this.expenseService.getTotalExpenses();
    
    // Initialize all categories with 0
    this.categories.forEach(cat => {
      if (cat.name !== 'Income') {
        categoryMap.set(cat.name, 0);
      }
    });
    
    // Sum expenses by category
    this.expenses.forEach(expense => {
      if (expense.type === 'expense') {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
      }
    });
    
    // Convert to array and calculate percentages
    this.categoryTotals = Array.from(categoryMap.entries())
      .map(([category, total]) => ({
        category,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }

  getCategoryColor(category: string): string {
    const cat = this.categories.find(c => c.name === category);
    return cat ? cat.color : '#999';
  }
}
