
import React from 'react';
import { Recipe } from '../types';

interface RecipeListProps {
  recipes: Recipe[];
  onSelect: (r: Recipe) => void;
  loading: boolean;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelect, loading }) => {
  if (loading) return <div className="text-center py-20 text-slate-400">Generating recipes...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <h2 className="text-2xl font-bold text-slate-800">Suggested Recipes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div 
            key={recipe.id}
            onClick={() => onSelect(recipe)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 flex flex-col"
          >
            <img src={recipe.imageUrl} className="w-full aspect-video object-cover" alt={recipe.title} />
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{recipe.title}</h3>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold">{recipe.difficulty}</span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 italic">"{recipe.description}"</p>
              <div className="mt-auto flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span><i className="fa-regular fa-clock mr-1"></i> {recipe.prepTime}</span>
                <span>{recipe.calories} kcal</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeList;
