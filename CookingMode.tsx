
import React, { useState } from 'react';
import { Recipe, ShoppingItem } from './types';
import { speakText } from './geminiService';

interface CookingModeProps {
  recipe: Recipe;
  onExit: () => void;
  onAddToShoppingList: (name: string) => void;
  shoppingList: ShoppingItem[];
}

const CookingMode: React.FC<CookingModeProps> = ({ recipe, onExit, onAddToShoppingList, shoppingList }) => {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Info */}
      <div className="w-full md:w-1/3 bg-slate-900 text-white p-8 overflow-y-auto">
        <button onClick={onExit} className="mb-8 text-slate-400 font-bold flex items-center gap-2 hover:text-white">
          <i className="fa-solid fa-arrow-left"></i> Exit
        </button>
        <img src={recipe.imageUrl} className="w-full aspect-video object-cover rounded-xl mb-6 shadow-2xl" alt="" />
        <h1 className="text-3xl font-black mb-4">{recipe.title}</h1>
        
        <div className="space-y-6">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h3 className="font-bold text-emerald-400 mb-4 uppercase text-xs tracking-widest">Ingredients</h3>
            <ul className="space-y-3">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="opacity-80">{ing.name} ({ing.quantity})</span>
                  <button 
                    onClick={() => onAddToShoppingList(ing.name)}
                    className={`text-lg transition-all ${shoppingList.find(s => s.name === ing.name) ? 'text-emerald-500' : 'text-white/20 hover:text-white'}`}
                  >
                    <i className="fa-solid fa-plus-circle"></i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Instructions Area */}
      <div className="flex-1 p-12 md:p-24 overflow-y-auto flex flex-col">
        <div className="max-w-3xl mx-auto w-full flex-1">
          <div className="flex items-center justify-between mb-12">
            <span className="text-slate-400 font-black uppercase tracking-widest text-sm">Step {step + 1} / {recipe.instructionsID.length}</span>
            <button onClick={() => speakText(recipe.instructionsID[step])} className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 transition-all">
              <i className="fa-solid fa-volume-high"></i>
            </button>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-slate-800 leading-tight mb-12 animate-in fade-in slide-in-from-right-4 duration-500">
            {recipe.instructionsID[step]}
          </h2>
        </div>

        <div className="max-w-3xl mx-auto w-full flex gap-4 mt-auto">
          <button 
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-5 bg-slate-100 rounded-2xl font-bold disabled:opacity-30"
          >
            Previous
          </button>
          <button 
            onClick={() => step < recipe.instructionsID.length - 1 ? setStep(s => s + 1) : onExit()}
            className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100"
          >
            {step === recipe.instructionsID.length - 1 ? "Finish Cooking" : "Next Step"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookingMode;
