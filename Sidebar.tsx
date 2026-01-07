
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

  const handleNavClick = (tab: any) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed md:sticky top-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-100 p-4 md:p-5 space-y-3 md:space-y-4 h-screen overflow-y-auto transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl md:shadow-none`}>
        <div className="flex items-center justify-between shrink-0 mb-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-base md:text-lg shadow-lg shadow-emerald-100">
              <i className="fa-solid fa-leaf"></i>
            </div>
            <span className="text-lg md:text-xl font-black tracking-tighter text-slate-800">CulinaryAI</span>
          </div>
          <button onClick={onClose} className="md:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-lg">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <nav className="space-y-0.5">
          {[
            { id: 'fridge', icon: 'fa-camera', label: 'Scanner' },
            { id: 'inventory', icon: 'fa-boxes-stacked', label: 'My Stok' },
            { id: 'planner', icon: 'fa-calendar-days', label: 'Meal Plan' },
            { id: 'shopping', icon: 'fa-basket-shopping', label: 'List' },
          ].map(nav => (
            <button 
              key={nav.id}
              onClick={() => handleNavClick(nav.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${activeTab === nav.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <i className={`fa-solid ${nav.icon} text-base w-5 text-center`}></i>
              <span className="text-sm font-semibold">{nav.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <button
            onClick={() => { onDietaryChange(DietaryRestriction.None); if (onClose) onClose(); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${currentDietary === DietaryRestriction.None ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Hapus Filter
          </button>

          <div className="space-y-0.5">
            <button 
              onClick={() => setOpenSection(openSection === 'diet' ? null : 'diet')}
              className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
              <span>Dietary</span>
              <i className={`fa-solid fa-chevron-${openSection === 'diet' ? 'down' : 'right'} text-[7px]`}></i>
            </button>
            {openSection === 'diet' && (
              <div className="space-y-0 px-1.5 animate-in slide-in-from-top-1">
                {dietOptions.map(diet => (
                  <button
                    key={diet}
                    onClick={() => { onDietaryChange(diet); if (onClose) onClose(); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentDietary === diet ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600'}`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <button 
              onClick={() => setOpenSection(openSection === 'bulking' ? null : 'bulking')}
              className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
              <span>Fitness</span>
              <i className={`fa-solid fa-chevron-${openSection === 'bulking' ? 'down' : 'right'} text-[7px]`}></i>
            </button>
            {openSection === 'bulking' && (
              <div className="space-y-0 px-1.5 animate-in slide-in-from-top-1">
                {bulkingOptions.map(diet => (
                  <button
                    key={diet}
                    onClick={() => { onDietaryChange(diet); if (onClose) onClose(); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentDietary === diet ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600'}`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto p-4 bg-emerald-600 rounded-[1.5rem] text-white shadow-lg shadow-emerald-100/50 shrink-0">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Chef Assistant</p>
          <p className="text-[11px] font-bold leading-tight">Dapur pintar, masak tanpa sisa.</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
