
import React, { useState } from 'react';
import { ShoppingItem } from './types';

interface ShoppingListProps {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onAddItem: (name: string) => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ items, onToggle, onClear, onAddItem }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddItem(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-row justify-between items-end gap-2 px-1">
        <div className="flex-1">
          <h1 className="text-lg md:text-4xl font-black text-slate-800">Shopping List</h1>
          <p className="text-[10px] md:text-base text-slate-500 leading-tight">Essential items missing for your recipes.</p>
        </div>
        <button 
          onClick={onClear}
          className="text-[9px] md:text-sm font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg shrink-0"
        >
          Clear All
        </button>
      </header>

      {/* Manual Ingredient Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add item..."
          className="flex-1 bg-white border border-slate-200 rounded-xl md:rounded-2xl px-3 md:px-5 py-2.5 md:py-4 text-xs md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm min-w-0"
        />
        <button 
          type="submit"
          className="bg-emerald-600 text-white px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-base hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 shrink-0"
        >
          Add
        </button>
      </form>

      <div className="bg-white rounded-[1.2rem] md:rounded-3xl p-3 md:p-8 border border-slate-200 shadow-sm divide-y divide-slate-100">
        {items.length > 0 ? items.map(item => (
          <div 
            key={item.id} 
            onClick={() => onToggle(item.id)}
            className="py-2 md:py-4 flex items-center gap-3 md:gap-4 cursor-pointer group"
          >
            <div className={`w-4 h-4 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
              {item.checked && <i className="fa-solid fa-check text-[7px] md:text-[10px]"></i>}
            </div>
            <span className={`font-bold text-[12px] md:text-base transition-all break-words min-w-0 flex-1 ${item.checked ? 'text-slate-300 line-through font-medium' : 'text-slate-700'}`}>
              {item.name}
            </span>
          </div>
        )) : (
          <div className="text-center py-6 md:py-12 text-slate-300 italic text-[11px] md:text-base">
            List is empty.
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
