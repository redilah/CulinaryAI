
import React, { useState } from 'react';
import { analyzeFridgeImage, generateRecipes, generateRecipeImage, estimateInventory, generateMealPlan } from './geminiService';
import { Recipe, DietaryRestriction, ShoppingItem, InventoryItem, MealPlanDay } from './types';
import Sidebar from './Sidebar';
import FridgeScanner from './FridgeScanner';
import RecipeList from './RecipeList';
import CookingMode from './CookingMode';
import ShoppingList from './ShoppingList';
import InventoryDashboard from './components/InventoryDashboard';
import MealPlanner from './components/MealPlanner';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fridge' | 'inventory' | 'planner' | 'shopping'>('fridge');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [dietary, setDietary] = useState<DietaryRestriction>(DietaryRestriction.None);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleCapture = async (base64s: string[]) => {
    setLoading(true);
    try {
      const detected = await analyzeFridgeImage(base64s);
      if (detected.length === 0) {
        alert("Bahan tidak ditemukan. Coba gunakan foto yang lebih dekat atau pencahayaan yang lebih baik.");
      } else {
        setIngredients(detected);
        const estimated = await estimateInventory(detected);
        setInventory(prev => {
          const combined = [...prev, ...estimated];
          return combined.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
        });
        
        const suggestions = await generateRecipes(detected, dietary);
        const withImages = await Promise.all(suggestions.map(async r => ({
          ...r, imageUrl: await generateRecipeImage(r.title)
        })));
        setRecipes(withImages);
      }
    } catch (err) {
      alert("Terjadi masalah saat memproses gambar.");
    } finally {
      setLoading(false);
    }
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

  const handleGeneratePlan = async () => {
    setLoading(true);
    setActiveTab('planner');
    const plan = await generateMealPlan(inventory);
    setMealPlan(plan);
    setLoading(false);
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

  const navItems = [
    { id: 'fridge', icon: 'fa-camera', label: 'Scanner' },
    { id: 'inventory', icon: 'fa-boxes-stacked', label: 'Stock' },
    { id: 'planner', icon: 'fa-calendar-days', label: 'Plan' },
    { id: 'shopping', icon: 'fa-basket-shopping', label: 'List' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        currentDietary={dietary} 
        onDietaryChange={handleDietChange} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 min-w-0 p-4 md:p-12 lg:p-16 pb-32 md:pb-12 overflow-y-auto">
        <div className="md:hidden flex items-center justify-between mb-6">
           <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs">
               <i className="fa-solid fa-leaf"></i>
             </div>
             <span className="font-black text-slate-800 tracking-tighter text-lg">CulinaryAI</span>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 bg-white rounded-xl shadow-sm border border-slate-100">
             <i className="fa-solid fa-bars-staggered text-lg"></i>
           </button>
        </div>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'fridge' && (
            <div className="space-y-8 md:space-y-12">
              <header className="space-y-1">
                <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-tight">
                  My Culinary Assistant
                </h1>
                <p className="text-slate-500 text-[12px] md:text-xl font-medium max-w-2xl">Upload up to 5 photos of your ingredients (fridge, pantry, or specific items).</p>
              </header>
              <FridgeScanner onCapture={handleCapture} loading={loading} detectedIngredients={ingredients} dietary={dietary} />
              <RecipeList recipes={recipes} onSelect={setSelectedRecipe} loading={loading} />
            </div>
          )}

          {activeTab === 'inventory' && (
            <InventoryDashboard inventory={inventory} setInventory={setInventory} onGeneratePlan={handleGeneratePlan} loading={loading} />
          )}

          {activeTab === 'planner' && (
            <MealPlanner plan={mealPlan} onRefresh={handleGeneratePlan} loading={loading} />
          )}

          {activeTab === 'shopping' && (
            <ShoppingList 
              items={shoppingList} 
              onToggle={(id) => setShoppingList(prev => prev.map(i => i.id === id ? {...i, checked: !i.checked} : i))} 
              onClear={() => setShoppingList([])}
              onAddItem={(name) => setShoppingList(prev => [...prev, { id: Date.now().toString(), name, checked: false }])}
            />
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-40 bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-lg p-1.5 flex items-center justify-between">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-[1.2rem] transition-all ${activeTab === item.id ? 'text-emerald-600 font-black bg-emerald-50/50' : 'text-slate-400 font-medium'}`}
          >
            <i className={`fa-solid ${item.icon} text-base mb-0.5`}></i>
            <span className="text-[9px] uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
