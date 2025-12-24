import { Component } from '@angular/core';
import { ExpenseService } from '../services/expense.service';
import { Category, Budget } from '../models/expense.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-manager',
  imports: [CommonModule, FormsModule],
  templateUrl: './category-manager.html',
  styleUrl: './category-manager.css',
})
export class CategoryManager {
 categories: Category[] = [];
  budgets: Budget[] = [];
  
  // New category form
  newCategoryName: string = '';
  newCategoryColor: string = '#667eea';
  newCategoryIcon: string = '📦';
  
  // Editing state
  editingCategory: Category | null = null;
  editCategoryName: string = '';
  editCategoryColor: string = '';
  editCategoryIcon: string = '';
  
  // Icons for selection
  icons = ['🍔', '🚌', '🎬', '📚', '🛍️', '🏠', '💊', '🎮', '☕', '✈️', '📱', '💻', '👕', '🎁', '🏋️', '🎨', '📦', '💰'];
  
  // Colors for selection
  colors = [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', 
    '#667eea', '#764ba2', '#FF9A9E', '#A1C4FD', '#C2E9FB',
    '#FFD1DC', '#84FAB0', '#8EC5FC', '#E0C3FC', '#FAACA8'
  ];

  constructor(private expenseService: ExpenseService) {}

  ngOnInit(): void {
    this.expenseService.categories$.subscribe(categories => {
      this.categories = categories;
    });
    
    this.expenseService.budgets$.subscribe(budgets => {
      this.budgets = budgets;
    });
  }

  addCategory(): void {
    if (this.newCategoryName.trim()) {
      this.expenseService.addCategory({
        name: this.newCategoryName.trim(),
        color: this.newCategoryColor,
        icon: this.newCategoryIcon
      });
      
      // Reset form
      this.newCategoryName = '';
      this.newCategoryColor = '#667eea';
      this.newCategoryIcon = '📦';
    }
  }

  startEdit(category: Category): void {
    this.editingCategory = category;
    this.editCategoryName = category.name;
    this.editCategoryColor = category.color;
    this.editCategoryIcon = category.icon;
  }

  saveEdit(): void {
    if (this.editingCategory && this.editCategoryName.trim()) {
      const updatedCategory: Category = {
        ...this.editingCategory,
        name: this.editCategoryName.trim(),
        color: this.editCategoryColor,
        icon: this.editCategoryIcon
      };
      
      this.expenseService.updateCategory(this.editingCategory.name, updatedCategory);
      this.cancelEdit();
    }
  }

  cancelEdit(): void {
    this.editingCategory = null;
    this.editCategoryName = '';
    this.editCategoryColor = '';
    this.editCategoryIcon = '';
  }

  deleteCategory(category: Category): void {
    if (!category.isDefault && confirm(`Delete category "${category.name}"? All expenses in this category will be moved to "Other".`)) {
      this.expenseService.deleteCategory(category.name);
    }
  }

  updateBudgetLimit(category: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newLimit = parseFloat(input.value);
    
    if (!isNaN(newLimit) && newLimit >= 0) {
      this.expenseService.updateBudgetLimit(category, newLimit);
    }
  }

  getBudgetForCategory(categoryName: string): Budget | undefined {
    return this.budgets.find(b => b.category === categoryName);
  }

  getRemainingCategories(): Category[] {
    // Filter out Income category from budget management
    return this.categories.filter(c => c.name !== 'Income');
  }

}
