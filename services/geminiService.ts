
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, DietaryRestriction, InventoryItem, MealPlanDay } from "../types";

const safeJsonParse = (str: string) => {
  try {
    const jsonMatch = str.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    const target = jsonMatch ? jsonMatch[0] : str;
    return JSON.parse(target.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""));
  } catch (e) {
    console.error("Gagal parse JSON AI:", str);
    throw new Error("Resep terlalu detail untuk dibaca. Silakan coba lagi.");
  }
};

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

export const analyzeFridgeImage = async (base64Input: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const sanitizedBase64 = base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: sanitizedBase64, mimeType: "image/jpeg" } },
          { text: "Identifikasi semua bahan makanan di foto ini. Sebutkan daftar nama bahannya saja, pisahkan dengan koma. Gunakan Bahasa Indonesia." }
        ] 
      }
    });
    const text = response.text || "";
    return text.split(/[,\n]/).map(i => i.trim().toLowerCase()).filter(i => i.length > 2);
  } catch (e) { 
    return ["telur", "bawang", "cabai", "tomat"]; 
  }
};

export const generateRecipes = async (ingredients: string[], restriction: DietaryRestriction): Promise<Recipe[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // LOGIKA ATOMIC 10-15 YANG DIKUNCI
  const prompt = `Kamu adalah Koki Eksekutif Bintang 5 dengan presisi militer. 
  Buat 5 resep mewah ${restriction} hanya dari bahan: ${ingredients.join(', ')}.

  KRITERIA ATOMIC 10-15 (WAJIB):
  1. INSTRUKSI: Terdiri dari 12 hingga 15 langkah kecil yang SANGAT DETAIL.
  2. DETAIL API: Setiap langkah pemanasan wajib menyebut jenis api: Api Lilin, Api Kecil, Api Sedang, atau Api Besar.
  3. METRIK PRESISI: Wajib menggunakan Gram (gr), Mililiter (ml), Centimeter (cm), atau Milimeter (mm). DILARANG menggunakan kata "secukupnya".
  4. URUTAN BUMBU (Sequential Spice Logic): Masukkan bumbu SATU PER SATU. Berikan alasan aroma/visual untuk setiap bumbu sebelum memasukkan bumbu berikutnya.
  5. TIMER: Sebutkan durasi waktu dalam menit atau detik secara eksak.
  6. FORMAT: Berikan JSON ARRAY murni (Bahasa Indonesia).

  Struktur JSON:
  [{
    "title": "Nama Masakan Mewah",
    "description": "Deskripsi gastronomi yang menarik.",
    "difficulty": "Easy/Medium/Hard",
    "prep_time": "XX Menit",
    "calories": 123,
    "ingredients": [{"name": "Bahan", "quantity": "Takaran Eksak (gr/ml/cm)"}],
    "instructions": ["Langkah 1...", "Langkah 2...", "... (total 12-15 langkah)"]
  }]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Model paling cerdas untuk instruksi panjang
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 8000 } // Thinking Budget lebih besar untuk logika presisi
      }
    });
    
    const raw = safeJsonParse(response.text || "[]");
    return raw.map((r: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: r.title,
      description: r.description,
      difficulty: r.difficulty,
      prepTime: r.prep_time,
      calories: r.calories,
      ingredientsID: r.ingredients,
      instructionsID: r.instructions,
      ingredientsEN: r.ingredients,
      instructionsEN: r.instructions,
      imageUrl: "" 
    }));
  } catch (e) {
    console.error("Gagal membuat resep atomic:", e);
    return [];
  }
};

export const generateRecipeImage = async (title: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-end food photography of ${title}, restaurant presentation, 4k.` }] }
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
      contents: `Berikan estimasi masa simpan bahan berikut (JSON: name, category, days_remaining): ${ingredients.join(', ')}.`,
      config: { responseMimeType: "application/json" }
    });
    const result = safeJsonParse(response.text || "[]");
    return result.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      category: item.category || "Segar",
      daysRemaining: item.days_remaining || 5,
      addedDate: new Date().toISOString(),
      freshness: Math.min(100, ((item.days_remaining || 5) / 10) * 100)
    }));
  } catch (e) { return []; }
};

export const generateMealPlan = async (inventory: InventoryItem[]): Promise<MealPlanDay[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Buat jadwal makan 3 hari dari bahan: ${inventory.map(i => i.name).join(', ')}. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeJsonParse(response.text || "[]");
  } catch (e) { return []; }
};
