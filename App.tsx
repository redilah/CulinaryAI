
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

  const handleCapture = async (base64: string) => {
    setLoading(true);
    const detected = await analyzeFridgeImage(base64);
    if (detected.includes("__INVALID_IMAGE__")) {
      alert("Gambar tidak terbaca sebagai isi kulkas. Coba lagi.");
    } else {
      setIngredients(detected);
      const estimated = await estimateInventory(detected);
      setInventory(prev => [...prev, ...estimated]);
      
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
      
      <main className="flex-1 min-w-0 p-6 md:p-12 lg:p-16 pb-32 md:pb-12 overflow-y-auto">
        {/* Premium Mobile Header: Logo Left, Menu Right */}
        <div className="md:hidden flex items-center justify-between mb-8">
           <div className="flex items-center space-x-2">
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-sm shadow-lg shadow-emerald-100">
               <i className="fa-solid fa-leaf"></i>
             </div>
             <span className="font-black text-slate-800 tracking-tighter text-2xl">CulinaryAI</span>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 text-slate-600 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-transform">
             <i className="fa-solid fa-bars-staggered text-xl"></i>
           </button>
        </div>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'fridge' && (
            <div className="space-y-12">
              <header className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  My Culinary Assistant
                </h1>
                <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl">Snap a photo to see what you can cook today with AI-powered precision.</p>
              </header>
              <FridgeScanner onCapture={handleCapture} loading={loading} detectedIngredients={ingredients} dietary={dietary} />
              <RecipeList recipes={recipes} onSelect={setSelectedRecipe} loading={loading} />
            </div>
          )}

          {activeTab === 'inventory' && (
            <InventoryDashboard 
              inventory={inventory} 
              setInventory={setInventory} 
              onGeneratePlan={handleGeneratePlan} 
              loading={loading} 
            />
          )}

          {activeTab === 'planner' && (
            <MealPlanner 
              plan={mealPlan} 
              onRefresh={handleGeneratePlan} 
              loading={loading} 
            />
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

      {/* Premium Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-40 bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-2 flex items-center justify-between">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex-1 flex flex-col items-center justify-center py-3.5 rounded-[1.5rem] transition-all duration-300 ${
              activeTab === item.id 
                ? 'text-emerald-600 font-black bg-emerald-50/50' 
                : 'text-slate-400 font-medium'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-lg mb-1`}></i>
            <span className="text-[10px] uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
