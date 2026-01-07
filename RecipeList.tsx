
import React from 'react';
import { Recipe } from './types';

interface RecipeListProps {
  recipes: Recipe[];
  onSelect: (r: Recipe) => void;
  loading: boolean;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelect, loading }) => {
  if (loading && recipes.length === 0) return null;
  if (recipes.length === 0 && !loading) return null;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 mt-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-8 gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">AI Generated Menus</h2>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px] md:text-xs">Based on detected pantry items</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs md:text-sm uppercase tracking-widest bg-emerald-50 px-5 py-2 rounded-2xl border border-emerald-100">
           <i className="fa-solid fa-sparkles"></i>
           <span>{recipes.length} Creations</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {recipes.map((recipe, idx) => (
          <div 
            key={recipe.id}
            onClick={() => onSelect(recipe)}
            className="group bg-white rounded-[3.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-emerald-200/50 transition-all duration-500 cursor-pointer border border-slate-100 flex flex-col transform hover:-translate-y-2 animate-in slide-in-from-bottom-10"
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            <div className="relative h-64 md:h-72 overflow-hidden">
               {recipe.imageUrl ? (
                 <img src={recipe.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={recipe.title} />
               ) : (
                 <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <i className="fa-solid fa-camera text-slate-300 text-5xl animate-pulse"></i>
                 </div>
               )}
               <div className="absolute top-6 right-6 bg-slate-900/90 backdrop-blur-xl text-white px-5 py-2 rounded-2xl text-[10px] md:text-xs font-black shadow-2xl border border-white/10 uppercase tracking-widest">
                  {Math.round(recipe.calories)} kcal
               </div>
               <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>

            <div className="p-8 md:p-10 flex-1 flex flex-col">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-[1.1] mb-5 group-hover:text-emerald-600 transition-colors">
                {recipe.title}
              </h3>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center text-slate-500 font-bold text-xs md:text-sm">
                  <i className="fa-regular fa-clock mr-2 text-emerald-500"></i> {recipe.prepTime}
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  recipe.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' : 
                  recipe.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' : 
                  'bg-rose-50 text-rose-700'
                }`}>
                  {recipe.difficulty}
                </div>
              </div>

              <p className="text-slate-500 font-medium leading-relaxed line-clamp-3 text-sm italic mb-8">
                "{recipe.description}"
              </p>
              
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">View Cooking Mode</span>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeList;
