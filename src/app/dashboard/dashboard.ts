import { Component, ElementRef } from '@angular/core';
import { ExpenseService } from '../services/expense.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Analytics } from "../analytics/analytics";
import { ExpenseListComponent } from "../expense-list/expense-list";
import { BudgetOverview } from "../budget-overview/budget-overview";
import { AddExpense } from "../add-expense/add-expense";
import { CategoryManager } from '../category-manager/category-manager';
import { Subscription } from 'rxjs'; // Add this
// import { PullToRefresh } from "../pull-to-refresh/pull-to-refresh"; // Add this
@Component({
  selector: 'app-dashboard',
  imports: [ FormsModule, CommonModule, Analytics, ExpenseListComponent, BudgetOverview, AddExpense, CategoryManager],// Add this
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  totalExpenses: number = 0;
  totalIncome: number = 0;
  balance: number = 0;
  isLoading = false;
  lastUpdated = new Date();
  private totalsSubscription!: Subscription; // Add this
  
  constructor(
    private expenseService: ExpenseService,
    private elementRef: ElementRef
  ) {}
  

  ngOnInit(): void {
    this.updateTotals();

    this.totalsSubscription = this.expenseService.totals$.subscribe(totals => {
      this.totalIncome = totals.income;
      this.totalExpenses = totals.expenses;
      this.balance = totals.balance;
      console.log('Dashboard updated automatically!', totals);
    });

  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.totalsSubscription) {
      this.totalsSubscription.unsubscribe();
    }
  }

  

  // ngAfterViewInit(): void {
  //   this.preventBrowserPullToRefresh();
  // }

  updateTotals(): void {
    this.totalExpenses = this.expenseService.getTotalExpenses();
    this.totalIncome = this.expenseService.getTotalIncome();
    this.balance = this.expenseService.getBalance();
    this.lastUpdated = new Date();
  }

  // Handle pull-to-refresh event
  onPullToRefresh(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    // Simulate API call or data refresh
    setTimeout(() => {
      // In a real app, you would fetch fresh data from an API
      // For now, we'll just reload from localStorage
      this.updateTotals();
      
      // Show success message
      this.showSuccessMessage('Data refreshed successfully!');
      
      this.isLoading = false;
    }, 1000);
  }

  // Show success toast
  showSuccessMessage(message: string): void {
    // You can implement a toast service or use a simple alert
    console.log(message);
    
    // Optional: Create a simple toast notification
    const toast = document.createElement('div');
    toast.textContent = '✅ ' + message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #06D6A0, #4CAF50);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 1000;
      font-weight: 600;
      animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }

  // Prevent default browser pull-to-refresh
  private preventBrowserPullToRefresh(): void {
    const dashboardElement = this.elementRef.nativeElement.querySelector('.dashboard-container');
    
    if (dashboardElement) {
      dashboardElement.addEventListener('touchmove', (e: TouchEvent) => {
        if (dashboardElement.scrollTop === 0) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }

  // Manual refresh button (optional)
  manualRefresh(): void {
    this.onPullToRefresh();
  }
}

