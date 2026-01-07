
import React from 'react';
import { MealPlanDay } from '../types';

interface MealPlannerProps {
  plan: MealPlanDay[];
  onRefresh: () => void;
  loading: boolean;
}

const MealPlanner: React.FC<MealPlannerProps> = ({ plan, onRefresh, loading }) => {
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-600 font-black uppercase tracking-widest text-sm animate-pulse">Designing your plan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Smart Meal Planner</h1>
          <p className="text-slate-500">Zero waste strategy using your expiring ingredients.</p>
        </div>
        <button onClick={onRefresh} className="text-emerald-600 font-bold text-xs uppercase tracking-widest hover:text-emerald-700">
          Regenerate <i className="fa-solid fa-rotate-right ml-1"></i>
        </button>
      </header>

      <div className="space-y-6">
        {plan.map((day, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                {idx + 1}
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{day.day}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Breakfast', menu: day.breakfast, icon: 'fa-sun' },
                { label: 'Lunch', menu: day.lunch, icon: 'fa-cloud-sun' },
                { label: 'Dinner', menu: day.dinner, icon: 'fa-moon' },
              ].map(meal => (
                <div key={meal.label} className="bg-slate-50 p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <i className={`fa-solid ${meal.icon} text-xs`}></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">{meal.label}</span>
                  </div>
                  <p className="font-bold text-slate-800 leading-snug">{meal.menu}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-center">
              <i className="fa-solid fa-circle-exclamation text-amber-500"></i>
              <p className="text-xs text-amber-800 font-medium italic">{day.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPlanner;
