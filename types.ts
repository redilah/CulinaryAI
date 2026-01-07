
export interface Ingredient {
  name: string;
  quantity?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  addedDate: string;
  daysRemaining: number;
  freshness: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: string;
  calories: number;
  ingredients: Ingredient[];
  ingredientsID: Ingredient[];
  ingredientsEN: Ingredient[];
  instructionsID: string[];
  instructionsEN: string[];
  imageUrl: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface MealPlanDay {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  reason: string;
}

export enum DietaryRestriction {
  Vegetarian = 'Vegetarian',
  Vegan = 'Vegan',
  Keto = 'Keto',
  GlutenFree = 'Gluten-Free',
  Paleo = 'Paleo',
  None = 'None',
  HighProtein = 'High Protein',
  MassGainer = 'Mass Gainer',
  LeanBulk = 'Lean Bulk',
  PowerMeal = 'Power Meal'
}
