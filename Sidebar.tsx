
import React, { useState } from 'react';
import { DietaryRestriction } from './types';

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
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed md:sticky top-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-slate-200 p-8 space-y-8 h-screen overflow-y-auto scrollbar-hide transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-100">
              <i className="fa-solid fa-leaf"></i>
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-800">CulinaryAI</span>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 p-2">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <nav className="space-y-1.5">
          {[
            { id: 'fridge', icon: 'fa-camera', label: 'Fridge Scanner' },
            { id: 'inventory', icon: 'fa-boxes-stacked', label: 'My Inventory' },
            { id: 'planner', icon: 'fa-calendar-days', label: 'Meal Planner' },
            { id: 'shopping', icon: 'fa-basket-shopping', label: 'Shopping List' },
          ].map(nav => (
            <button 
              key={nav.id}
              onClick={() => { setActiveTab(nav.id as any); onClose?.(); }}
              className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all ${activeTab === nav.id ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <i className={`fa-solid ${nav.icon} text-lg w-6`}></i>
              <span className="text-sm">{nav.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-5">
          <button
            onClick={() => onDietaryChange(DietaryRestriction.None)}
            className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentDietary === DietaryRestriction.None ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            No Filter
          </button>

          <div>
            <button 
              onClick={() => setOpenSection(openSection === 'diet' ? null : 'diet')}
              className="w-full flex items-center justify-between px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
              <span>Dietary Filters</span>
              <i className={`fa-solid fa-chevron-${openSection === 'diet' ? 'down' : 'right'} text-[8px]`}></i>
            </button>
            {openSection === 'diet' && (
              <div className="mt-2 space-y-1 px-2">
                {dietOptions.map(diet => (
                  <button
                    key={diet}
                    onClick={() => onDietaryChange(diet)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentDietary === diet ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-slate-100'}`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <button 
              onClick={() => setOpenSection(openSection === 'bulking' ? null : 'bulking')}
              className="w-full flex items-center justify-between px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
              <span>Bulking Filters</span>
              <i className={`fa-solid fa-chevron-${openSection === 'bulking' ? 'down' : 'right'} text-[8px]`}></i>
            </button>
            {openSection === 'bulking' && (
              <div className="mt-2 space-y-1 px-2">
                {bulkingOptions.map(diet => (
                  <button
                    key={diet}
                    onClick={() => onDietaryChange(diet)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentDietary === diet ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-slate-100'}`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Restore Sidebar Footer Info Block */}
        <div className="mt-auto p-6 bg-emerald-600 rounded-[2rem] text-white shadow-xl shadow-emerald-100 animate-in fade-in duration-1000">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Smart Assist</p>
          <p className="text-sm font-bold leading-snug text-emerald-50">Reduce food waste with AI-powered meal logic.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
