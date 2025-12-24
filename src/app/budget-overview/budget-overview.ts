import { Component } from '@angular/core';
import { ExpenseService } from '../services/expense.service';
import { Budget, Category } from '../models/expense.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs'; // Add this
@Component({
  selector: 'app-budget-overview',
  imports: [FormsModule, CommonModule], // Add this
  templateUrl: './budget-overview.html',
  styleUrl: './budget-overview.css',
})
export class BudgetOverview {
  budgets: Budget[] = [];
  categories: Category[] = [];

  constructor(private expenseService: ExpenseService) {}
  private subscription!: Subscription; // Add this

  ngOnInit(): void {
    this.budgets = this.expenseService.getBudgets();
    this.categories = this.expenseService.getCategories();

     // Subscribe to expense updates to refresh budgets
    this.subscription = this.expenseService.expenses$.subscribe(() => {
      this.budgets = this.expenseService.getBudgets();
    });
    // Subscribe to categories for color/icon info
  this.expenseService.categories$.subscribe(categories => {
    this.categories = categories;
  });
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getCategoryColor(category: string): string {
    const cat = this.categories.find(c => c.name === category);
    return cat ? cat.color : '#999';
  }
// ADD THIS METHOD - It was missing
  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.name === category);
    return cat ? cat.icon : '📦';
  }
  getProgressPercentage(budget: Budget): number {
    return (budget.spent / budget.limit) * 100;
  }

  getProgressColor(percentage: number): string {
    if (percentage > 100) return '#FF6B6B';
    if (percentage > 80) return '#FFD166';
    return '#06D6A0';
  }
}