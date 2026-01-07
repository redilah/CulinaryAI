
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {recipes.map(recipe => (
        <div 
          key={recipe.id} 
          onClick={() => onSelect(recipe)}
          className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="h-48 overflow-hidden relative">
            <img src={recipe.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={recipe.title} />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase">
              {recipe.difficulty}
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{recipe.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 mb-4">{recipe.description}</p>
            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span><i className="fa-solid fa-clock mr-1"></i> {recipe.prepTime}</span>
              <span><i className="fa-solid fa-fire mr-1"></i> {recipe.calories} KCAL</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecipeList;
