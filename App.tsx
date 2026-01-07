
import React, { useState } from 'react';
import { analyzeFridgeImage, generateRecipes, generateRecipeImage } from './geminiService';
import { Recipe, DietaryRestriction, ShoppingItem } from './types';
import Sidebar from './Sidebar';
import FridgeScanner from './FridgeScanner';
import RecipeList from './RecipeList';
import CookingMode from './CookingMode';
import ShoppingList from './ShoppingList';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fridge' | 'shopping'>('fridge');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [dietary, setDietary] = useState<DietaryRestriction>(DietaryRestriction.None);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCapture = async (base64: string) => {
    setLoading(true);
    const detected = await analyzeFridgeImage(base64);
    if (detected.includes("__INVALID_IMAGE__")) {
      alert("Please take a clear photo of your fridge contents.");
    } else {
      setIngredients(detected);
      const suggestions = await generateRecipes(detected, dietary);
      const withImages = await Promise.all(suggestions.map(async r => ({
        ...r, imageUrl: await generateRecipeImage(r.title)
      })));
      setRecipes(withImages);
    }
    setLoading(false);
  };

  const handleDietChange = async (d: DietaryRestriction) => {
    setDietary(d);
    if (ingredients.length > 0) {
      setLoading(true);
      const suggestions = await generateRecipes(ingredients, d);
      const withImages = await Promise.all(suggestions.map(async r => ({
        ...r, imageUrl: await generateRecipeImage(r.title)
      })));
      setRecipes(withImages);
      setLoading(false);
    }
  };

  const addToShoppingList = (name: string) => {
    if (!shoppingList.find(i => i.name === name)) {
      setShoppingList(prev => [...prev, { id: Date.now().toString(), name, checked: false }]);
    }
  };

  if (selectedRecipe) {
    return (
      <CookingMode 
        recipe={selectedRecipe} 
        onExit={() => setSelectedRecipe(null)} 
        onAddToShoppingList={addToShoppingList} 
        shoppingList={shoppingList}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeDiet={dietary} onDietChange={handleDietChange} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'fridge' ? (
          <div className="max-w-5xl mx-auto space-y-8">
            <header>
              <h1 className="text-4xl font-black text-slate-800">Smart Fridge</h1>
              <p className="text-slate-500">Snap a photo to see what you can cook today.</p>
            </header>
            <FridgeScanner onCapture={handleCapture} loading={loading} ingredients={ingredients} />
            <RecipeList recipes={recipes} onSelect={setSelectedRecipe} loading={loading} />
          </div>
        ) : (
          <ShoppingList items={shoppingList} onToggle={(id) => setShoppingList(prev => prev.map(i => i.id === id ? {...i, checked: !i.checked} : i))} />
        )}
      </main>
    </div>
  );
};

export default App;
