
import React, { useState, useEffect } from 'react';
import { analyzeFridgeImage, generateRecipes, generateRecipeImage, estimateInventory, generateMealPlan } from './services/geminiService';
import { Recipe, InventoryItem, ShoppingItem, DietaryRestriction, MealPlanDay } from './types';

// UI Components
import Sidebar from './components/Sidebar';
import FridgeScanner from './components/FridgeScanner';
import RecipeList from './components/RecipeList';
import CookingMode from './components/CookingMode';
import ShoppingList from './components/ShoppingList';
import InventoryDashboard from './components/InventoryDashboard';
import MealPlanner from './components/MealPlanner';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fridge' | 'shopping' | 'inventory' | 'planner'>('fridge');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>([]);
  const [recipeCache, setRecipeCache] = useState<Partial<Record<DietaryRestriction, Recipe[]>>>({});
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [dietary, setDietary] = useState<DietaryRestriction>(DietaryRestriction.None);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchRecipesWithImages = async (ingredientsList: string[], diet: DietaryRestriction) => {
    if (ingredientsList.length === 0) return;
    
    setLoading(true);
    try {
      // Step 1: Generate text recipes first
      const suggestions = await generateRecipes(ingredientsList, diet);
      
      if (!suggestions || suggestions.length === 0) {
        console.warn("No recipes suggested for these ingredients.");
        setLoading(false);
        return;
      }

      // Step 2: Try to get images for each, but don't fail if one or all fail (quota limit)
      const recipesWithImages = await Promise.all(suggestions.map(async (recipe) => {
        try {
          const imageUrl = await generateRecipeImage(recipe.title, recipe.description);
          return { ...recipe, imageUrl };
        } catch (imgError) {
          console.error(`Could not generate image for ${recipe.title}:`, imgError);
          // Fallback image is handled inside generateRecipeImage or we can provide a final one here
          return { ...recipe, imageUrl: recipe.imageUrl || 'https://images.unsplash.com/photo-1495195129352-aec329a7c7bb?q=80&w=800' };
        }
      }));

      setRecipeCache(prev => ({ ...prev, [diet]: recipesWithImages }));
    } catch (error) {
      console.error("Recipe fetching error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDietChange = (d: DietaryRestriction) => {
    setDietary(d);
    setIsFilterOpen(false);
    if (ingredients.length > 0) {
      fetchRecipesWithImages(ingredients, d);
    }
  };

  const handleImageCapture = async (base64: string) => {
    setLoading(true);
    try {
      const detected = await analyzeFridgeImage(base64);
      console.log("Detected ingredients:", detected);
      
      if (detected.includes("__INVALID_IMAGE__")) {
        alert("Gambar tidak terbaca sebagai makanan. Pastikan foto bahan makanan atau isi kulkas dengan jelas.");
        setIngredients([]); 
        setLoading(false);
        return;
      }

      if (detected.length === 0) {
        alert("AI tidak mendeteksi item makanan apapun. Coba foto lain.");
        setIngredients([]);
        setLoading(false);
        return;
      }

      setIngredients(detected);
      
      const estimatedItems = await estimateInventory(detected);
      setInventory(prev => {
        const existingNames = new Set(prev.map(i => i.name.toLowerCase()));
        const newItems = estimatedItems.filter(i => !existingNames.has(i.name.toLowerCase()));
        return [...prev, ...newItems];
      });

      // Clear cache and fetch fresh for the current diet
      setRecipeCache({}); 
      await fetchRecipesWithImages(detected, dietary);
    } catch (error) {
      console.error("Capture handling error:", error);
      alert("Terjadi kesalahan saat memproses gambar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (inventory.length === 0) return;
    setLoading(true);
    try {
      const plan = await generateMealPlan(inventory);
      setMealPlan(plan);
      setActiveTab('planner');
    } catch (e) {} finally { setLoading(false); }
  };

  const addToShoppingList = (name: string) => {
    if (shoppingList.some(item => item.name.toLowerCase() === name.toLowerCase())) return;
    setShoppingList(prev => [...prev, { id: Date.now().toString(), name, checked: false }]);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8fafc] text-slate-900 pb-20 md:pb-0">
      {/* Mobile Header */}
      {!isCooking && (
        <header className="md:hidden flex items-center justify-between px-6 py-5 bg-white sticky top-0 z-30 border-b border-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-lg shadow-sm">
              <i className="fa-solid fa-leaf"></i>
            </div>
            <span className="text-xl font-black tracking-tight text-[#1e293b]">CulinaryAI</span>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-emerald-600 bg-emerald-50/50 border border-emerald-100 rounded-xl transition-all active:scale-90 shadow-sm"
            >
              <i className="fa-solid fa-sliders text-base"></i>
            </button>
          </div>
        </header>
      )}

      {/* Sidebar */}
      {!isCooking && (
        <Sidebar 
          currentDietary={dietary} 
          onDietaryChange={handleDietChange} 
          activeTab={activeTab}
          setActiveTab={(t) => { setActiveTab(t); setIsSidebarOpen(false); }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      {!isCooking && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-around items-center z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
          {[
            { id: 'fridge', icon: 'fa-utensils', label: 'FRIDGE' },
            { id: 'shopping', icon: 'fa-cart-shopping', label: 'LIST' },
          ].map(nav => (
            <button 
              key={nav.id}
              onClick={() => setActiveTab(nav.id as any)}
              className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === nav.id ? 'text-emerald-600 scale-105' : 'text-slate-400'}`}
            >
              <i className={`fa-solid ${nav.icon} text-xl`}></i>
              <span className="text-[10px] font-black tracking-widest">{nav.label}</span>
            </button>
          ))}
        </nav>
      )}

      <main className="flex-1 p-4 md:p-8 overflow-y-auto smooth-scroll">
        {isCooking && selectedRecipe ? (
          <CookingMode 
            recipe={selectedRecipe} 
            shoppingList={shoppingList}
            onExit={() => setIsCooking(false)} 
            onAddToShoppingList={addToShoppingList}
          />
        ) : activeTab === 'fridge' ? (
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            {/* Desktop Header */}
            <header className="hidden md:block">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Kitchen Assistant</h1>
              <p className="text-slate-500 text-sm">Scan fridge and manage your ingredients effortlessly.</p>
            </header>

            {/* Mobile Header Text Block */}
            <div className="md:hidden pt-2 pb-4">
              <h1 className="text-3xl font-black text-[#1e293b] tracking-tight mb-1">My Culinary Assistant</h1>
              <p className="text-slate-400 text-sm font-medium">Scan fridge to unlock delicious possibilities.</p>
            </div>

            <FridgeScanner onCapture={handleImageCapture} detectedIngredients={ingredients} loading={loading} dietary={dietary} />

            {ingredients.length > 0 && (
              <RecipeList 
                recipes={recipeCache[dietary] || []} 
                onSelect={(r) => { setSelectedRecipe(r); setIsCooking(true); }} 
                loading={loading} 
              />
            )}
          </div>
        ) : activeTab === 'inventory' ? (
          <InventoryDashboard inventory={inventory} setInventory={setInventory} onGeneratePlan={handleGeneratePlan} loading={loading} />
        ) : activeTab === 'planner' ? (
          <MealPlanner plan={mealPlan} onRefresh={handleGeneratePlan} loading={loading} />
        ) : (
          <ShoppingList items={shoppingList} onToggle={(id) => setShoppingList(prev => prev.map(i => i.id === id ? {...i, checked: !i.checked} : i))} onClear={() => setShoppingList([])} onAddItem={addToShoppingList} />
        )}
      </main>
    </div>
  );
};

export default App;
