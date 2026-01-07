
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, DietaryRestriction, InventoryItem, MealPlanDay } from "./types";

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

export const analyzeFridgeImage = async (base64Images: string[]): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const parts = base64Images.map(data => ({
      inlineData: { data, mimeType: 'image/jpeg' }
    }));
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          ...parts,
          { text: "PERAN: Detektif Bahan Makanan Ahli. TUGAS: Identifikasi semua bahan makanan di foto ini. Meskipun foto BURAM, GELAP, atau RESOLUSI RENDAH, gunakan insting koki Anda untuk menebak objek tersebut (misal: botol merah kemungkinan saus sambal, kotak putih kemungkinan tahu/keju). Berikan daftar nama bahan saja dipisahkan dengan koma dalam Bahasa Indonesia. JANGAN memberikan penjelasan. Jika benar-benar kosong, balas 'BUKAN_MAKANAN'." }
        ] 
      }
    });
    
    const responseText = response.text || "";
    if (responseText.includes("BUKAN_MAKANAN")) return ["__INVALID_IMAGE__"];

    const detected = responseText
      .split(/[,\n]/)
      .map(s => s.replace(/^\d+[\s.)]+/, '').trim().toLowerCase())
      .filter(s => s.length > 1 && !s.includes("maaf") && !s.includes("berikut adalah"));
      
    return detected.length > 0 ? detected : ["bahan makanan", "bumbu"];
  } catch (e) { 
    console.error("Analysis error:", e);
    return []; 
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

export const generateRecipes = async (ingredients: string[], restriction: DietaryRestriction): Promise<Recipe[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // LOGIKA SUPER DETAIL - KOKI BINTANG 5 (ATOMIC STEPS)
  const systemPrompt = `Kamu adalah koki ahli bintang 5. Buat 4 resep lezat untuk diet ${restriction} menggunakan bahan: ${ingredients.join(', ')}. 

WAJIB: INSTRUKSI HARUS SANGAT ATOMIK, DETAIL DAN TERPERINCI (Pecah menjadi 10-15 langkah kecil):
1. Setiap langkah WAJIB menyertakan ukuran api secara spesifik (Contoh: "Gunakan api kecil sekali/api lilin", "Gunakan api sedang", "Gunakan api besar").
2. Setiap langkah WAJIB menyertakan takaran presisi dalam gram (gr) atau mililiter (ml) untuk setiap bumbu/bahan yang dimasukkan.
3. Setiap langkah WAJIB menyertakan durasi waktu yang sangat akurat dalam menit atau detik (Contoh: "Tumis selama 3 menit hingga harum", "Diamkan selama 30 detik").
4. Urutan Bumbu Spesifik: Jelaskan urutan masuk bumbu secara satu-per-satu (Misal: "Masukan 5gr garam dulu, aduk 20 detik, baru masukan 2gr gula").
5. Kalori harus dalam angka bulat (Integer), contoh: 420 kcal.

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
  } catch (e) { return []; }
};

export const generateRecipeImage = async (title: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Gourmet plating of ${title}, high-end restaurant style, 8k resolution, food photography.` }] }
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
