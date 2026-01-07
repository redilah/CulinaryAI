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
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-800">Shopping List</h1>
          <p className="text-slate-500">Essential items missing for your recipes.</p>
        </div>
        <button 
          onClick={onClear}
          className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider"
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
          placeholder="Add an ingredient..."
          className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
        />
        <button 
          type="submit"
          className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
        >
          Add
        </button>
      </form>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm divide-y divide-slate-100">
        {items.length > 0 ? items.map(item => (
          <div 
            key={item.id} 
            onClick={() => onToggle(item.id)}
            className="py-4 flex items-center gap-4 cursor-pointer group"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
              {item.checked && <i className="fa-solid fa-check text-[10px]"></i>}
            </div>
            <span className={`font-bold transition-all ${item.checked ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
              {item.name}
            </span>
          </div>
        )) : (
          <div className="text-center py-12 text-slate-300 italic">
            List is empty. Add ingredients from recipe view.
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;