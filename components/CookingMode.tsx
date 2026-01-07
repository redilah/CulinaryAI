
import React, { useState, useEffect, useRef } from 'react';
import { Recipe, ShoppingItem } from '../types';
import { speakText } from '../services/geminiService';
import { LiveAssistant } from '../services/liveAssistantService';

interface CookingModeProps {
  recipe: Recipe;
  shoppingList: ShoppingItem[];
  onExit: () => void;
  onAddToShoppingList: (name: string) => void;
}

const CookingMode: React.FC<CookingModeProps> = ({ recipe, shoppingList, onExit, onAddToShoppingList }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [transcriptionLogs, setTranscriptionLogs] = useState<string[]>([]);
  
  const liveRef = useRef<LiveAssistant | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const instructions = lang === 'ID' ? recipe.instructionsID : recipe.instructionsEN;

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptionLogs]);

  const handleToggleLive = async () => {
    if (isLiveActive) {
      liveRef.current?.stop();
      setIsLiveActive(false);
    } else {
      const assistant = new LiveAssistant(
        (text, isNewTurn) => {
          setTranscriptionLogs(prev => {
            if (isNewTurn || prev.length === 0) return [...prev, text];
            const updated = [...prev];
            updated[updated.length - 1] += text;
            return updated;
          });
        },
        recipe.title,
        recipe.ingredients.map(i => i.name).join(', ')
      );
      await assistant.start(instructions[currentStep]);
      liveRef.current = assistant;
      setIsLiveActive(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-8 flex flex-col h-full overflow-y-auto">
        <button onClick={onExit} className="mb-8 text-slate-400 font-bold text-sm hover:text-slate-600">
          <i className="fa-solid fa-arrow-left mr-2"></i> Exit Cooking Mode
        </button>
        
        <img src={recipe.imageUrl} className="w-full aspect-video object-cover rounded-2xl mb-6 shadow-md" alt={recipe.title} />
        <h1 className="text-2xl font-bold text-slate-800 mb-4">{recipe.title}</h1>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
            Ingredients Needed
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setLang('ID')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${lang === 'ID' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>ID</button>
              <button onClick={() => setLang('EN')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${lang === 'EN' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>EN</button>
            </div>
          </h3>
          <ul className="space-y-3">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{ing.name} ({ing.quantity})</span>
                <button onClick={() => onAddToShoppingList(ing.name)} className="text-emerald-600 hover:text-emerald-700">
                  <i className={`fa-solid ${shoppingList.some(s => s.name === ing.name) ? 'fa-check-circle' : 'fa-plus-circle'}`}></i>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8 md:p-16 bg-white overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between mb-12">
            <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full font-bold text-sm">
              Step {currentStep + 1} of {instructions.length}
            </span>
            <div className="flex gap-4">
              <button onClick={() => speakText(instructions[currentStep])} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200">
                <i className="fa-solid fa-volume-high"></i>
              </button>
              <button onClick={handleToggleLive} className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${isLiveActive ? 'bg-rose-500 animate-pulse' : 'bg-slate-900'}`}>
                <i className={`fa-solid ${isLiveActive ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              </button>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-12">
            {instructions[currentStep]}
          </h2>

          <div className="flex gap-4">
            <button 
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold disabled:opacity-30"
            >
              Previous
            </button>
            <button 
              onClick={() => {
                if (currentStep < instructions.length - 1) setCurrentStep(prev => prev + 1);
                else onExit();
              }}
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200"
            >
              {currentStep === instructions.length - 1 ? 'Finish' : 'Next Step'}
            </button>
          </div>

          {transcriptionLogs.length > 0 && (
            <div className="mt-12 bg-slate-900 rounded-2xl p-6 text-white text-sm space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-800 pb-2">Nary Assistant Log</p>
              {transcriptionLogs.map((log, i) => (
                <p key={i} className="leading-relaxed"><span className="text-emerald-400">Nary:</span> {log}</p>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookingMode;
