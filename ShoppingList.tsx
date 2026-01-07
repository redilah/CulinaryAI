
import React from 'react';
import { ShoppingItem } from './types';

interface ShoppingListProps {
  items: ShoppingItem[];
  onToggle: (id: string) => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ items, onToggle }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-black text-slate-800">Shopping List</h1>
        <p className="text-slate-500">Essential items missing for your recipes.</p>
      </header>

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
