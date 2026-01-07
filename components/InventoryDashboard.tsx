
import React from 'react';
import { InventoryItem } from '../types';

interface InventoryDashboardProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onGeneratePlan: () => void;
  loading: boolean;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ inventory, setInventory, onGeneratePlan, loading }) => {
  const removeItem = (id: string) => setInventory(prev => prev.filter(i => i.id !== id));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Kitchen Stock</h1>
          <p className="text-slate-500">Track freshness and manage your ingredients digitaly.</p>
        </div>
        <button 
          onClick={onGeneratePlan}
          disabled={inventory.length === 0 || loading}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
          AI Meal Planner
        </button>
      </header>

      {inventory.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-3xl mx-auto">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-600">Your Inventory is Empty</h3>
          <p className="text-slate-400 max-w-sm mx-auto">Scan your fridge with the camera to automatically populate your kitchen digital stock.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.sort((a, b) => a.daysRemaining - b.daysRemaining).map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: item.daysRemaining <= 2 ? '#f43f5e' : item.daysRemaining <= 5 ? '#f59e0b' : '#10b981' }}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{item.category}</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">{item.name}</h3>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-slate-200 hover:text-rose-500 transition-colors">
                  <i className="fa-solid fa-circle-xmark"></i>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Freshness Status</span>
                  <span className={`font-bold ${item.daysRemaining <= 2 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.daysRemaining} days left
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${item.daysRemaining <= 2 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (item.daysRemaining / 10) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
