
import React, { useState } from 'react';
import { ShoppingItem } from '../types';

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
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Shopping List</h1>
          <p className="text-slate-500">Essential items you need for your next meal.</p>
        </div>
        <button 
          onClick={onClear}
          className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider"
        >
          Clear All
        </button>
      </header>

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

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-1">
        {items.length > 0 ? (
          items.map((item) => (
            <div 
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all group"
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'
              }`}>
                {item.checked && <i className="fa-solid fa-check text-[10px]"></i>}
              </div>
              <span className={`flex-1 font-medium transition-all ${
                item.checked ? 'text-slate-300 line-through' : 'text-slate-700'
              }`}>
                {item.name}
              </span>
              <button className="text-slate-200 group-hover:text-rose-400 transition-colors">
                <i className="fa-regular fa-trash-can"></i>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-3xl mx-auto">
              <i className="fa-solid fa-cart-arrow-down"></i>
            </div>
            <p className="text-slate-400 font-medium italic">Your cart is empty. Ready for the market?</p>
          </div>
        )}
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
          <i className="fa-solid fa-lightbulb"></i>
        </div>
        <div>
          <h4 className="font-bold text-emerald-800">Pro Tip</h4>
          <p className="text-sm text-emerald-700 leading-relaxed">
            Scan your fridge again before you go to the store. We'll automatically identify what's back in stock!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;
