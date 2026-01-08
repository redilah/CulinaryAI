
import React, { useState } from 'react';
import { analyzeFridgeImage, generateRecipes, generateRecipeImage, estimateInventory, generateMealPlan } from './services/geminiService';
import { Recipe, DietaryRestriction, ShoppingItem, InventoryItem, MealPlanDay } from './types';
import Sidebar from './Sidebar';
import FridgeScanner from './FridgeScanner';
import RecipeList from './RecipeList';
import CookingMode from './CookingMode';
import ShoppingList from './ShoppingList';
import InventoryDashboard from './InventoryDashboard';
import MealPlanner from './MealPlanner';

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
  const [loadingStep, setLoadingStep] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleProcessing = (step: string) => {
    if (step) {
      setLoading(true);
      setLoadingStep(step);
    } else {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleCapture = async (base64: string) => {
    if (!base64) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      setLoadingStep("Membaca foto Anda...");
      const detected = await analyzeFridgeImage(base64);
      setIngredients(detected);
      
      setLoadingStep("AI sedang meracik resep atomic...");
      const suggestions = await generateRecipes(detected, dietary);
      
      if (suggestions && suggestions.length > 0) {
        setRecipes(suggestions); 
        setLoading(false);
        setLoadingStep("");

        suggestions.forEach(async (r, idx) => {
          try {
            const img = await generateRecipeImage(r.title);
            setRecipes(prev => prev.map((rec, i) => i === idx ? {...rec, imageUrl: img} : rec));
          } catch (e) {}
        });

        estimateInventory(detected).then(estimated => {
          setInventory(prev => [...prev, ...estimated].slice(0, 50));
        }).catch(() => {});
      } else {
        setLoading(false);
        setLoadingStep("");
        alert("AI gagal membuat resep. Coba lagi.");
      }
    } catch (err: any) {
      setLoading(false);
      setLoadingStep("");
      alert(`Gangguan: ${err?.message || "Koneksi tidak stabil"}`);
    }
  };

  const handleDietChange = async (d: DietaryRestriction) => {
    setDietary(d);
    if (ingredients.length > 0) {
      setLoading(true);
      setLoadingStep(`Menyesuaikan menu ${d}...`);
      try {
        const suggestions = await generateRecipes(ingredients, d);
        setRecipes(suggestions);
        setLoading(false);
        suggestions.forEach(async (r, idx) => {
          const img = await generateRecipeImage(r.title);
          setRecipes(prev => prev.map((rec, i) => i === idx ? { ...rec, imageUrl: img } : rec));
        });
      } catch (e) {
        setLoading(false);
      }
      setLoadingStep("");
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setLoadingStep("Menyusun jadwal makan...");
    try {
      const plan = await generateMealPlan(inventory);
      setMealPlan(plan);
      setActiveTab('planner');
    } catch (e) {
      alert("Gagal menyusun jadwal.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const addToShoppingList = (name: string) => {
    if (!shoppingList.find(i => i.name.toLowerCase() === name.toLowerCase())) {
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
    { id: 'fridge', icon: 'fa-camera', label: 'Scan' },
    { id: 'inventory', icon: 'fa-boxes-stacked', label: 'Stok' },
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
      
      <main className="flex-1 min-w-0 p-5 md:p-12 lg:p-16 pb-32 overflow-y-auto scrollbar-hide">
        <div className="md:hidden flex items-center justify-between mb-8">
           <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
               <i className="fa-solid fa-leaf"></i>
             </div>
             <span className="font-black text-slate-800 text-xl tracking-tighter">CulinaryAI</span>
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="w-11 h-11 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 active:scale-95 transition-transform">
             <i className="fa-solid fa-bars-staggered text-lg"></i>
           </button>
        </div>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'fridge' && (
            <div className="space-y-10">
              <header className="space-y-2">
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight">
                  My Kitchen Assistant
                </h1>
                <p className="text-slate-500 text-sm md:text-xl font-medium max-w-3xl leading-relaxed">
                  Ambil foto bahan makanan Anda, biarkan AI bekerja dengan presisi tinggi.
                </p>
              </header>
              <FridgeScanner 
                onCapture={handleCapture} 
                onProcessing={handleProcessing}
                loading={loading} 
                loadingStep={loadingStep} 
                detectedIngredients={ingredients} 
                dietary={dietary} 
              />
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

      <nav className="md:hidden fixed bottom-6 left-5 right-5 z-40 bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-1.5 flex items-center justify-between">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[2rem] transition-all duration-300 ${activeTab === item.id ? 'text-emerald-600 bg-emerald-50 font-black' : 'text-slate-400 font-medium hover:text-slate-600'}`}
          >
            <i className={`fa-solid ${item.icon} text-lg mb-0.5`}></i>
            <span className="text-[9px] uppercase tracking-widest leading-none">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
