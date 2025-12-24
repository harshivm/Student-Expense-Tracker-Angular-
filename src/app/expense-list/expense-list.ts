import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ExpenseService } from '../services/expense.service';
import { Expense } from '../models/expense.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-expense-list',
  imports: [FormsModule, CommonModule], // Add this
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.css',
  animations: [ // ADD THIS BLOCK
    trigger('slideOut', [
      transition(':leave', [
        animate('300ms ease-in', style({
          opacity: 0,
          transform: 'translateX(100%)',
          height: 0,
          margin: 0,
          padding: 0
        }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ExpenseList {
  @Output() expenseDeleted = new EventEmitter<void>();
 deletedExpense: Expense | null = null; // ADD THIS LINE
  showUndoMessage: boolean = false; // ADD THIS LINE
  undoTimeout: any = null; // ADD THIS LINE
  
  expenses: Expense[] = [];

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadExpenses();

    // Subscribe to expense updates
    this.expenseService.expenses$.subscribe(expenses => {
      this.expenses = expenses;
    });
  }

  loadExpenses(): void {
    this.expenses = this.expenseService.getExpenses();
  }

    deleteExpense(id: string): void {
    // Store the expense before deleting (for undo)
    const expenseToDelete = this.expenses.find(exp => exp.id === id);
    
    if (expenseToDelete) {
      this.deletedExpense = { ...expenseToDelete };
      this.expenseService.deleteExpense(id); // DELETE WITHOUT CONFIRMATION
      
      // Show undo message
      this.showUndoMessage = true;
      
      // Auto hide undo message after 5 seconds
      this.undoTimeout = setTimeout(() => {
        this.hideUndoMessage();
      }, 5000);
    }
  }
    // ADD these new methods (add after deleteExpense method):
  undoDelete(): void {
    if (this.deletedExpense) {
      // Add the expense back
      this.expenseService.addExpense({
        amount: this.deletedExpense.amount,
        category: this.deletedExpense.category,
        description: this.deletedExpense.description,
        date: this.deletedExpense.date,
        type: this.deletedExpense.type
      });
      
      this.hideUndoMessage();
    }
  }

  hideUndoMessage(): void {
    this.showUndoMessage = false;
    this.deletedExpense = null;
    
    if (this.undoTimeout) {
      clearTimeout(this.undoTimeout);
      this.undoTimeout = null;
    }
  }

  getCategoryColor(category: string): string {
    const categories = this.expenseService.getCategories();
    const cat = categories.find(c => c.name === category);
    return cat ? cat.color : '#999';
  }

}

