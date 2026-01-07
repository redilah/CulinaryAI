
export interface Ingredient {
  name: string;
  quantity?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Produce' | 'Dairy' | 'Meat' | 'Pantry' | 'Others';
  addedDate: string;
  daysRemaining: number;
  freshness: number; // 0 to 100
}

export interface MealPlanDay {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  reason: string; // e.g., "Menggunakan bayam yang hampir layu"
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: string;
  calories: number;
  ingredients: Ingredient[];
  instructionsID: string[];
  instructionsEN: string[];
  imageUrl: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

export enum DietaryRestriction {
  Vegetarian = 'Vegetarian',
  Vegan = 'Vegan',
  Keto = 'Keto',
  GlutenFree = 'Gluten-Free',
  Paleo = 'Paleo',
  HighProtein = 'High Protein',
  MassGainer = 'Mass Gainer',
  LeanBulk = 'Lean Bulk',
  PowerMeal = 'Power Meal',
  None = 'None'
}
