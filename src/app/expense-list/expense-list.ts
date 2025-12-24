import { Component, OnInit } from '@angular/core';
import { ExpenseService } from '../services/expense.service';
import { Expense } from '../models/expense.model';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-list.html',
  styleUrls: ['./expense-list.css'],
  animations: [
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
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  deletedExpense: Expense | null = null;
  showUndoMessage: boolean = false;
  undoTimeout: any = null;

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.loadExpenses();

    // Subscribe to expense updates
    this.expenseService.expenses$.subscribe(expenses => {
      this.expenses = this.sortExpensesByDate(expenses);
    });
  }

  loadExpenses(): void {
    const expenses = this.expenseService.getExpenses();
    this.expenses = this.sortExpensesByDate(expenses);
  }

  private sortExpensesByDate(expenses: Expense[]): Expense[] {
    return [...expenses].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  deleteExpense(id: string): void {
    const expenseToDelete = this.expenses.find(exp => exp.id === id);
    
    if (expenseToDelete) {
      this.deletedExpense = { ...expenseToDelete };
      this.expenseService.deleteExpense(id);
      
      this.showUndoMessage = true;
      this.undoTimeout = setTimeout(() => {
        this.hideUndoMessage();
      }, 5000);
    }
  }

  undoDelete(): void {
    if (this.deletedExpense) {
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
// NO export { ExpenseList }; at the end!