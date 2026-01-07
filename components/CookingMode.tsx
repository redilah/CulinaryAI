
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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [transcriptionLogs, setTranscriptionLogs] = useState<string[]>([]);
  const [mobileSlide, setMobileSlide] = useState<'info' | 'steps'>('info');
  
  const liveRef = useRef<LiveAssistant | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const instructions = lang === 'ID' ? recipe.instructionsID : recipe.instructionsEN;
  const ingredientsString = recipe.ingredients.map(i => `${i.name} (${i.quantity || 'sesuai selera'})`).join(', ');

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [transcriptionLogs]);

  // Logic to capture and send frames when both AI Mic and Camera are active
  useEffect(() => {
    if (isLiveActive && isCameraActive && liveRef.current) {
      frameIntervalRef.current = window.setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx && video.readyState >= 2) {
            canvas.width = 640;
            canvas.height = 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
            liveRef.current?.sendFrame(base64Data);
          }
        }
      }, 2000); // Send frame every 2 seconds
    } else {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    }
    return () => { if (frameIntervalRef.current) clearInterval(frameIntervalRef.current); };
  }, [isLiveActive, isCameraActive]);

  const nextStep = () => { if (currentStep < instructions.length - 1) setCurrentStep(prev => prev + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1); };

  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play();
        }
        setIsCameraActive(true);
      } catch (err) { 
        alert("Camera access failed. Please ensure you've given permission."); 
      }
    }
  };

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
        ingredientsString
      );
      await assistant.start(instructions[currentStep]);
      liveRef.current = assistant;
      setIsLiveActive(true);
    }
  };

  const ActionButtons = () => (
    <div className="flex gap-2 md:gap-4 pt-4 w-full">
      <button 
        onClick={handleToggleCamera} 
        className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all shadow-sm ${
          isCameraActive 
            ? 'bg-rose-50 text-rose-600 border border-rose-100 ring-4 ring-rose-50' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        }`}
      >
        <i className={`fa-solid ${isCameraActive ? 'fa-video-slash' : 'fa-camera'} mb-1 block text-lg`}></i>
        {isCameraActive ? 'Close Cam' : 'Vision'}
      </button>
      <button onClick={() => speakText(instructions[currentStep])} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold uppercase text-[10px] md:text-xs tracking-widest text-slate-700 hover:bg-slate-50 transition-colors">
        <i className="fa-solid fa-volume-high mb-1 block text-lg"></i> Read
      </button>
      <button onClick={handleToggleLive} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest transition-all ${isLiveActive ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-200' : 'bg-slate-900 text-white shadow-lg shadow-slate-200'}`}>
        <i className={`fa-solid ${isLiveActive ? 'fa-microphone' : 'fa-microphone-slash'} mb-1 block text-lg`}></i> {isLiveActive ? 'Live' : 'AI Mic'}
      </button>
    </div>
  );

  const AssistantLog = () => {
    if (transcriptionLogs.length === 0) return null;
    return (
      <div className="mt-8 bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-600'}`}></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nary Assistant</p>
          </div>
          <button onClick={() => setTranscriptionLogs([])} className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Clear</button>
        </div>
        <div ref={logScrollRef} className="max-h-96 overflow-y-auto custom-scrollbar text-xs font-medium text-slate-200 leading-relaxed pr-2 space-y-5">
          {transcriptionLogs.map((log, i) => (
            <div key={i} className="flex gap-4 items-start animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-[0_0_10px_white]"></span>
              <p className="whitespace-pre-wrap">{log}</p>
            </div>
          ))}
          <div ref={logEndRef} className="h-1 w-full" />
        </div>
      </div>
    );
  };

  const StepNavigation = () => (
    <div className="flex justify-between items-center w-full mt-auto pt-8">
      <button 
        onClick={prevStep}
        className={`px-4 py-3 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all ${currentStep === 0 ? 'invisible' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}
      >
        <i className="fa-solid fa-arrow-left mr-2"></i> Back
      </button>
      <button 
        onClick={nextStep}
        className={`px-8 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${currentStep === instructions.length - 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'}`}
      >
        {currentStep === instructions.length - 1 ? 'Finish' : 'Next Step'} <i className="fa-solid fa-arrow-right ml-2"></i>
      </button>
    </div>
  );

  const RecipeInfo = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onExit} className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-colors">
          <i className="fa-solid fa-arrow-left"></i> Exit
        </button>
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button onClick={() => setLang('ID')} className={`px-3 py-1 text-[10px] font-black rounded-lg ${lang === 'ID' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>ID</button>
          <button onClick={() => setLang('EN')} className={`px-3 py-1 text-[10px] font-black rounded-lg ${lang === 'EN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>EN</button>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-[2rem] overflow-hidden mb-6 shadow-xl border border-slate-100 group">
        {isCameraActive ? (
          <div className="relative w-full h-full">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover mirror transform scale-x-[-1]" 
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-rose-600 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest animate-pulse">Live Vision</div>
              <div className="bg-black/40 backdrop-blur-md text-white/80 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">720p HD</div>
            </div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
               <div className="w-24 h-24 border-2 border-white/50 rounded-lg relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white"></div>
               </div>
            </div>
            <button 
              onClick={handleToggleCamera}
              className="absolute bottom-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all active:scale-90"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ) : (
          <img src={recipe.imageUrl} className="w-full h-full object-cover" alt={recipe.title} />
        )}
      </div>

      <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">{recipe.title}</h1>
      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
        <i className="fa-solid fa-list-check text-emerald-500"></i> Ingredients Needed
      </h3>
      <div className="space-y-0 mb-8 overflow-y-auto custom-scrollbar pr-2 flex-1">
        {recipe.ingredients.map((ing, idx) => (
          <div key={idx} className="flex items-center justify-between border-b border-slate-100 py-3.5 hover:bg-slate-50/50 transition-colors px-1 rounded-lg">
            <span className="text-slate-800 font-bold text-xs">{ing.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-[10px] font-medium">{ing.quantity}</span>
              <button 
                onClick={() => onAddToShoppingList(ing.name)} 
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  shoppingList.some(item => item.name.toLowerCase() === ing.name.toLowerCase()) 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                    : 'bg-slate-50 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                }`}
              >
                <i className={`fa-solid ${shoppingList.some(item => item.name.toLowerCase() === ing.name.toLowerCase()) ? 'fa-check' : 'fa-plus'} text-[10px]`}></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col md:flex-row overflow-hidden font-sans">
      <div className="md:hidden flex-1 relative overflow-hidden">
        <div className="flex h-full w-[200%] transition-transform duration-500 ease-in-out" style={{ transform: `translateX(${mobileSlide === 'info' ? '0%' : '-50%'})` }}>
          <div className="w-1/2 h-full p-6 overflow-y-auto bg-slate-50 flex flex-col">
            <RecipeInfo />
            <button onClick={() => setMobileSlide('steps')} className="mt-4 w-full py-5 bg-emerald-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-transform">
              Start Cooking Mode
            </button>
          </div>
          <div className="w-1/2 h-full flex flex-col p-6 overflow-y-auto bg-white">
             <button onClick={() => setMobileSlide('info')} className="text-emerald-600 font-black text-[10px] uppercase mb-6 flex items-center gap-2">
               <i className="fa-solid fa-chevron-left"></i> Recipe Info
             </button>
             <div className="flex-1 flex flex-col">
               <div className="flex-1 overflow-y-auto scrollbar-hide">
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3">Step {currentStep + 1} of {instructions.length}</p>
                 <h2 className="text-2xl font-bold text-slate-900 mb-8 leading-relaxed">{instructions[currentStep]}</h2>
                 <ActionButtons />
                 <AssistantLog />
               </div>
               <StepNavigation />
             </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-full h-full">
        <div className="w-[30%] bg-slate-50 border-r border-slate-200 p-10 flex flex-col h-full"><RecipeInfo /></div>
        <div className="flex-1 flex flex-col p-16 md:p-24 bg-white relative">
          <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-4 pb-20">
              <div className="flex items-center justify-between mb-8">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em]">Step {currentStep + 1} of {instructions.length}</p>
                <div className="h-1 flex-1 mx-8 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((currentStep + 1) / instructions.length) * 100}%` }}></div>
                </div>
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-12 leading-[1.4] tracking-tight">{instructions[currentStep]}</h2>
              <ActionButtons />
              <AssistantLog />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="absolute bottom-12 left-12 right-12 flex justify-between items-center bg-white/80 backdrop-blur-md py-4 px-6 rounded-[2rem] border border-slate-100 shadow-lg">
              <button onClick={prevStep} className={`px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all ${currentStep === 0 ? 'invisible' : 'text-slate-400 hover:text-slate-600 bg-white border border-slate-100 shadow-sm hover:shadow-md'}`}>
                <i className="fa-solid fa-arrow-left mr-2"></i> Back
              </button>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cooking Progress</div>
              <button onClick={nextStep} className={`px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${currentStep === instructions.length - 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95'}`}>
                {currentStep === instructions.length - 1 ? 'Finish Cooking' : 'Next Step'} <i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookingMode;
