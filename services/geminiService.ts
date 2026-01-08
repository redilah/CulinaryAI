
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, DietaryRestriction, InventoryItem, MealPlanDay } from "../types";

const cleanText = (text: string) => text.replace(/[*#_~]/g, '').trim();

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const analyzeFridgeImage = async (base64WithHeader: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Deteksi MIME Type Otomatis (WebP/JPEG/PNG)
    let mimeType = "image/jpeg";
    if (base64WithHeader.includes("data:")) {
      const match = base64WithHeader.match(/data:(.*?);base64/);
      if (match) mimeType = match[1];
    }
    
    // Pastikan hanya data base64 murni yang dikirim
    const sanitizedBase64 = base64WithHeader.includes(',') ? base64WithHeader.split(',')[1] : base64WithHeader;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: sanitizedBase64, mimeType } },
          { text: "Identifikasi bahan makanan di foto ini. Sebutkan nama bahannya saja dipisahkan koma dalam Bahasa Indonesia. Jika foto kurang jelas, tebak bahan yang paling mungkin." }
        ] 
      }
    });
    
    const responseText = response.text || "";
    const detected = responseText
      .split(/[,\n]/)
      .map(s => s.replace(/^\d+[\s.)]+/, '').trim().toLowerCase())
      .filter(s => s.length > 1 && !s.includes("maaf") && !s.includes("berikut adalah"));
      
    return detected.length > 0 ? detected : ["telur", "bawang merah", "bawang putih", "minyak goreng"];
  } catch (e) { 
    console.error("AI Analysis Error:", e);
    return ["telur", "bawang merah", "bawang putih"]; 
  }
};

export const generateRecipes = async (ingredients: string[], restriction: DietaryRestriction): Promise<Recipe[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemPrompt = `Buat 4 resep ${restriction} dari: ${ingredients.join(', ')}. Format JSON. Respon harus Bahasa Indonesia.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemPrompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
              prep_time: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              ingredients_id: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } } } },
              instructions_id: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });
    
    const raw = JSON.parse(response.text || "[]");
    return raw.map((r: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: r.title,
      description: r.description,
      difficulty: r.difficulty,
      prepTime: r.prep_time,
      calories: r.calories,
      ingredientsID: r.ingredients_id,
      instructionsID: r.instructions_id,
      ingredientsEN: r.ingredients_id,
      instructionsEN: r.instructions_id,
      imageUrl: "" 
    }));
  } catch (e) { return []; }
};

export const generateRecipeImage = async (title: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Professional food photography of ${title}, restaurant style, 4k.` }] }
    });
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  } catch (e) {}
  return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800`;
};

export const speakText = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText(text) }] }],
      config: { 
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch (e) {}
};

export const estimateInventory = async (ingredients: string[]): Promise<InventoryItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Bahan: ${ingredients.join(', ')}. Estimasikan masa simpan. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || "[]");
    return result.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      category: item.category,
      daysRemaining: item.days_remaining,
      addedDate: new Date().toISOString(),
      freshness: Math.min(100, (item.days_remaining / 10) * 100)
    }));
  } catch (e) { return []; }
};

export const generateMealPlan = async (inventory: InventoryItem[]): Promise<MealPlanDay[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Jadwal makan 3 hari dari: ${inventory.map(i => i.name).join(', ')}. JSON format.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) { return []; }
};
