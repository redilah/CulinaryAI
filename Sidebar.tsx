
import React from 'react';
import { DietaryRestriction } from './types';

interface SidebarProps {
  activeDiet: DietaryRestriction;
  onDietChange: (d: DietaryRestriction) => void;
  activeTab: 'fridge' | 'shopping';
  onTabChange: (t: 'fridge' | 'shopping') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeDiet, onDietChange, activeTab, onTabChange }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col space-y-8">
      <div className="flex items-center space-x-2 text-emerald-600">
        <i className="fa-solid fa-utensils text-2xl"></i>
        <span className="text-xl font-black tracking-tight">CulinaryAI</span>
      </div>

      <nav className="space-y-1">
        <button 
          onClick={() => onTabChange('fridge')}
          className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'fridge' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <i className="fa-solid fa-camera"></i>
          <span>Fridge Scanner</span>
        </button>
        <button 
          onClick={() => onTabChange('shopping')}
          className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center space-x-3 transition-all ${activeTab === 'shopping' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <i className="fa-solid fa-cart-shopping"></i>
          <span>Shopping List</span>
        </button>
      </nav>

      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Dietary Restrictions</h3>
        <div className="space-y-1">
          {Object.values(DietaryRestriction).map(d => (
            <button
              key={d}
              onClick={() => onDietChange(d)}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeDiet === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
