
import React, { useState } from 'react';
import { DietaryRestriction } from '../types';

interface SidebarProps {
  currentDietary: DietaryRestriction;
  onDietaryChange: (d: DietaryRestriction) => void;
  activeTab: 'fridge' | 'shopping' | 'inventory' | 'planner';
  setActiveTab: (t: 'fridge' | 'shopping' | 'inventory' | 'planner') => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentDietary, onDietaryChange, activeTab, setActiveTab, isOpen, onClose }) => {
  const [openSection, setOpenSection] = useState<'diet' | 'bulking' | null>('diet');

  const dietOptions = [
    DietaryRestriction.Vegetarian,
    DietaryRestriction.Vegan,
    DietaryRestriction.Keto,
    DietaryRestriction.GlutenFree,
    DietaryRestriction.Paleo,
  ];

  const bulkingOptions = [
    DietaryRestriction.HighProtein,
    DietaryRestriction.MassGainer,
    DietaryRestriction.LeanBulk,
    DietaryRestriction.PowerMeal,
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed md:sticky top-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 p-6 space-y-6 h-screen overflow-y-auto scrollbar-hide transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Brand Header & Close Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-100">
              <i className="fa-solid fa-leaf"></i>
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-800">CulinaryAI</span>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 p-2">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {[
            { id: 'fridge', icon: 'fa-camera', label: 'Fridge Scanner' },
            { id: 'inventory', icon: 'fa-boxes-stacked', label: 'My Inventory' },
            { id: 'planner', icon: 'fa-calendar-days', label: 'Meal Planner' },
            { id: 'shopping', icon: 'fa-basket-shopping', label: 'Shopping List' },
          ].map(nav => (
            <button 
              key={nav.id}
              onClick={() => setActiveTab(nav.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === nav.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <i className={`fa-solid ${nav.icon} w-5`}></i>
              <span className="text-sm">{nav.label}</span>
            </button>
          ))}
        </nav>

        {/* Filters Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          
          {/* Reset Filter */}
          <button
            onClick={() => onDietaryChange(DietaryRestriction.None)}
            className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentDietary === DietaryRestriction.None ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <i className="fa-solid fa-filter-circle-xmark mr-2"></i> No Filters
          </button>

          {/* Dietary Filters */}
          <div>
            <button 
              onClick={() => setOpenSection(openSection === 'diet' ? null : 'diet')}
              className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              <span>Dietary Filters</span>
              <i className={`fa-solid fa-chevron-${openSection === 'diet' ? 'down' : 'right'} text-[8px]`}></i>
            </button>
            {openSection === 'diet' && (
              <div className="mt-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {dietOptions.map(diet => (
                  <button
                    key={diet}
                    onClick={() => onDietaryChange(diet)}
                    className={`w-full text-left px-8 py-2 rounded-lg text-xs transition-colors ${currentDietary === diet ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-100'}`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bulking Filters */}
          <div>
            <button 
              onClick={() => setOpenSection(openSection === 'bulking' ? null : 'bulking')}
              className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              <span>Bulking Filters</span>
              <i className={`fa-solid fa-chevron-${openSection === 'bulking' ? 'down' : 'right'} text-[8px]`}></i>
            </button>
            {openSection === 'bulking' && (
              <div className="mt-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {bulkingOptions.map(diet => (
                  <button
                    key={diet}
                    onClick={() => onDietaryChange(diet)}
                    className={`w-full text-left px-8 py-2 rounded-lg text-xs transition-colors ${currentDietary === diet ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-100'}`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer Info */}
        <div className="mt-auto p-4 bg-emerald-600 rounded-2xl text-white">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Kitchen Manager</p>
          <p className="text-xs font-bold leading-tight">Reduce waste and cook with precision using CulinaryAI.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
