
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

export const analyzeFridgeImage = async (base64: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Ensure base64 is clean (no data:image/jpeg;base64, prefix)
    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: cleanBase64, mimeType: 'image/jpeg' } },
          { text: "PERAN: Detektif Bahan Makanan Ahli. TUGAS: Identifikasi bahan di foto ini. APAPUN KONDISI GAMBARNYA, Anda HARUS menebak bahan (botol merah = saus, kotak putih = tahu). JANGAN PERNAH MENOLAK ANALISA. Jika gelap/kosong, berikan daftar: Telur, Bawang Merah, Bawang Putih, Cabai, Minyak Goreng. Balas hanya dengan nama bahan dipisahkan koma dalam Bahasa Indonesia." }
        ] 
      }
    });
    
    const responseText = response.text || "";
    const detected = responseText
      .split(/[,\n]/)
      .map(s => s.replace(/^\d+[\s.)]+/, '').trim().toLowerCase())
      .filter(s => s.length > 1 && !s.includes("maaf") && !s.includes("gambar"));
      
    return detected.length > 0 ? detected : ["telur", "bawang merah", "bawang putih", "cabai", "minyak goreng"];
  } catch (e) { 
    console.error("Analysis failed:", e);
    return ["telur", "bawang merah", "bawang putih", "minyak goreng", "cabai"]; 
  }
};

export const generateRecipes = async (ingredients: string[], restriction: DietaryRestriction): Promise<Recipe[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemPrompt = `Kamu adalah koki ahli bintang 5. Buat 4 resep lezat untuk diet ${restriction} menggunakan bahan: ${ingredients.join(', ')}. 

WAJIB: INSTRUKSI SANGAT DETAIL (10-15 langkah kecil per resep):
1. UKURAN API: Sebutkan di setiap langkah (api lilin, sedang, besar).
2. TAKARAN: Gunakan gram (gr) atau mililiter (ml).
3. TIMER: Sebutkan menit/detik yang akurat.
4. URUTAN: Masukkan bumbu satu per satu.
5. KALORI: Angka bulat (Integer).

Sediakan output dalam JSON untuk Bahasa Indonesia (ID) dan English (EN).`;

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
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
              prep_time: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              ingredients_id: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } } } },
              instructions_id: { type: Type.ARRAY, items: { type: Type.STRING } },
              ingredients_en: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } } } },
              instructions_en: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });
    
    const raw = JSON.parse(response.text || "[]");
    return raw.map((r: any) => ({
      id: r.id || Math.random().toString(36).substr(2, 9),
      title: r.title,
      description: r.description,
      difficulty: r.difficulty,
      prepTime: r.prep_time,
      calories: r.calories,
      ingredientsID: r.ingredients_id,
      instructionsID: r.instructions_id,
      ingredientsEN: r.ingredients_en,
      instructionsEN: r.instructions_en,
      imageUrl: "" 
    }));
  } catch (e) { 
    console.error("Recipe generation failed:", e);
    return []; 
  }
};

export const generateRecipeImage = async (title: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-end professional food photography of ${title}, restaurant style, 8k resolution.` }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
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
  } catch (e) {
    console.error("TTS failed:", e);
  }
};

export const estimateInventory = async (ingredients: string[]): Promise<InventoryItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Bahan: ${ingredients.join(', ')}. Estimasikan masa simpan. Return JSON array InventoryItem (name, category, days_remaining).`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              days_remaining: { type: Type.INTEGER }
            }
          }
        }
      }
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
  const expiringSoon = [...inventory].sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 5).map(i => i.name);
  const prompt = `Jadwal makan 3 hari dari: ${expiringSoon.join(', ')}. JSON Bahasa Indonesia.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              breakfast: { type: Type.STRING },
              lunch: { type: Type.STRING },
              dinner: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) { return []; }
};
