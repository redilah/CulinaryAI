
import React from 'react';
import { Recipe } from '../types';

interface RecipeListProps {
  recipes: Recipe[];
  onSelect: (r: Recipe) => void;
  loading: boolean;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelect, loading }) => {
  if (loading && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Koki sedang meracik resep...</p>
      </div>
    );
  }
  
  if (recipes.length === 0 && !loading) return null;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 mt-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-8 gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Menu Rekomendasi</h2>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px] md:text-xs">Berdasarkan bahan yang terdeteksi</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs md:text-sm uppercase tracking-widest bg-emerald-50 px-5 py-2 rounded-2xl border border-emerald-100">
           <i className="fa-solid fa-sparkles"></i>
           <span>{recipes.length} Kreasi AI</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {recipes.map((recipe, idx) => (
          <div 
            key={recipe.id}
            onClick={() => onSelect(recipe)}
            className="group bg-white rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-emerald-200/40 transition-all duration-500 cursor-pointer border border-slate-100 flex flex-col transform hover:-translate-y-2 animate-in slide-in-from-bottom-10"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="relative h-56 md:h-64 overflow-hidden bg-slate-100">
               {recipe.imageUrl ? (
                 <img 
                    src={recipe.imageUrl} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                    alt={recipe.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800';
                    }}
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                    <i className="fa-solid fa-utensils text-slate-300 text-4xl animate-bounce"></i>
                 </div>
               )}
               <div className="absolute top-6 right-6 bg-slate-900/90 backdrop-blur-xl text-white px-4 py-1.5 rounded-xl text-[10px] font-black shadow-lg border border-white/10 uppercase tracking-widest">
                  {recipe.calories} kcal
               </div>
            </div>

            <div className="p-6 md:p-10 flex-1 flex flex-col">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                {recipe.title}
              </h3>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center text-slate-500 font-bold text-[10px] md:text-xs">
                  <i className="fa-regular fa-clock mr-1.5 text-emerald-500"></i> {recipe.prepTime}
                </div>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                  recipe.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' : 
                  recipe.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' : 
                  'bg-rose-50 text-rose-700'
                }`}>
                  {recipe.difficulty}
                </div>
              </div>

              <p className="text-slate-500 font-medium leading-relaxed line-clamp-3 text-xs italic mb-6">
                "{recipe.description}"
              </p>
              
              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-emerald-600 font-black text-[9px] uppercase tracking-[0.2em]">Masak Sekarang</span>
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <i className="fa-solid fa-chevron-right text-xs"></i>
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
