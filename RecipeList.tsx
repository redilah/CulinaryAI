
import React from 'react';
import { Recipe } from './types';

interface RecipeListProps {
  recipes: Recipe[];
  onSelect: (r: Recipe) => void;
  loading: boolean;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelect, loading }) => {
  if (loading) return null;
  if (recipes.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 mt-12">
      {/* Header with Matched badge on the right */}
      <header className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Suggested Recipes</h2>
        <span className="text-sm font-bold text-emerald-600">Matched to your fridge</span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.map((recipe) => (
          <div 
            key={recipe.id}
            onClick={() => onSelect(recipe)}
            className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-emerald-100 transition-all cursor-pointer border border-slate-100 flex flex-col"
          >
            {/* Image Container with Calorie Badge */}
            <div className="relative h-64 overflow-hidden">
               <img src={recipe.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={recipe.title} />
               <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-xl text-[11px] font-black text-slate-800 shadow-lg border border-slate-100">
                  {recipe.calories} kcal
               </div>
            </div>

            {/* Content Area */}
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-2xl font-black text-slate-900 leading-tight mb-4 group-hover:text-emerald-600 transition-colors">
                {recipe.title}
              </h3>

              {/* Metadata Row: Time and Difficulty */}
              <div className="flex items-center gap-4 mb-6">
                <span className="flex items-center text-emerald-600 font-bold text-sm">
                  <i className="fa-regular fa-clock mr-2"></i> {recipe.prepTime}
                </span>
                <span className={`px-4 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                  recipe.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' : 
                  recipe.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' : 
                  'bg-rose-50 text-rose-700'
                }`}>
                  {recipe.difficulty}
                </span>
              </div>

              {/* Truncated Description */}
              <p className="text-slate-500 font-medium leading-relaxed line-clamp-2 text-sm">
                {recipe.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeList;
