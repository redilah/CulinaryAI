
import React from 'react';
import { Recipe } from '../types';

interface RecipeListProps {
  recipes: Recipe[];
  onSelect: (r: Recipe) => void;
  loading: boolean;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelect, loading }) => {
  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-3xl p-4 shadow-sm animate-pulse space-y-4">
          <div className="w-full aspect-[4/3] bg-slate-100 rounded-2xl"></div>
          <div className="h-6 w-3/4 bg-slate-100 rounded-lg"></div>
          <div className="h-4 w-1/2 bg-slate-100 rounded-lg"></div>
        </div>
      ))}
    </div>
  );

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-500';
      case 'Medium':
        return 'bg-amber-50 text-amber-500';
      case 'Hard':
        return 'bg-rose-50 text-rose-500';
      default:
        return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">Suggested Recipes</h2>
        <span className="text-emerald-600 text-sm font-bold">Matched to your fridge</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div 
            key={recipe.id}
            onClick={() => onSelect(recipe)}
            className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer border border-slate-100 flex flex-col"
          >
            {/* Image Container with Calorie Badge */}
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img 
                src={recipe.imageUrl} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                alt={recipe.title}
              />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-white/20">
                <span className="text-[11px] font-black text-slate-700 tracking-tight">{recipe.calories} kcal</span>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-[#1e293b] text-xl mb-3 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                {recipe.title}
              </h3>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                  <i className="fa-regular fa-clock text-xs"></i>
                  <span>{recipe.prepTime}</span>
                </div>
                
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getDifficultyStyles(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </span>
              </div>

              <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed font-medium">
                {recipe.description}
              </p>
              
              <div className="mt-auto">
                <button className="w-full py-3.5 bg-emerald-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-[0.15em] shadow-lg shadow-emerald-100 group-hover:bg-emerald-700 transition-all active:scale-[0.98]">
                  Start Cooking
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeList;
