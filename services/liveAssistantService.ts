
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class LiveAssistant {
  private sessionPromise: Promise<any> | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private audioStream: MediaStream | null = null;
  private isNewTurn = true;
  private userName: string | null = localStorage.getItem('nary_user_name');

  constructor(
    private onMessage: (text: string, isNewTurn: boolean) => void,
    private recipeTitle: string,
    private ingredients: string
  ) {}

  async start(currentStep: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    if (this.inputAudioCtx.state === 'suspended') await this.inputAudioCtx.resume();
    if (this.outputAudioCtx.state === 'suspended') await this.outputAudioCtx.resume();

    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
    } catch (err) {
      console.error("Microphone access denied", err);
      return;
    }

    const systemInstruction = `Kamu adalah Nary, asisten masak personal yang sangat cerdas, hangat, dan sopan. 
    
    PERATURAN KOMUNIKASI:
    1. Jika belum tahu nama user, sapa dengan: "Halo, aku Nary asisten masakmu. Boleh aku tahu namamu agar kita lebih akrab?".
    2. Jika sudah tahu nama user (Nama: ${this.userName || 'Belum diketahui'}), panggil namanya di setiap respon.
    3. Gunakan bahasa Indonesia yang santai tapi tetap sangat sopan.
    4. Kamu bisa melihat melalui kamera. Jika user menunjukkan bahan atau proses masak, berikan saran atau komentar yang relevan.
    5. JANGAN gunakan markdown seperti bintang (*) atau pagar (#).
    
    KONTEKS:
    - Masakan: ${this.recipeTitle}.
    - Bahan: ${this.ingredients}.
    - Langkah saat ini: ${currentStep}.`;

    this.sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: systemInstruction,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        inputAudioTranscription: {},
        outputAudioTranscription: {}
      },
      callbacks: {
        onopen: () => {
          const source = this.inputAudioCtx!.createMediaStreamSource(this.audioStream!);
          const scriptProcessor = this.inputAudioCtx!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            if (this.sessionPromise) {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = this.createBlob(inputData);
              this.sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            }
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(this.inputAudioCtx!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) {
            this.isNewTurn = true;
          }
          if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text.replace(/[*#_~]/g, '');
            this.onMessage(text, this.isNewTurn);
            
            // Logika menyimpan nama jika user menyebutkan namanya
            if (text.toLowerCase().includes("nama saya") || text.toLowerCase().includes("panggil aku")) {
               const parts = text.split(" ");
               const potentialName = parts[parts.length - 1].replace(/[.!?]/g, "");
               if (potentialName.length > 2) {
                 localStorage.setItem('nary_user_name', potentialName);
                 this.userName = potentialName;
               }
            }
            this.isNewTurn = false;
          }
          const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioBase64) await this.playAudio(audioBase64);
          if (message.serverContent?.interrupted) this.stopAllAudio();
        },
        onerror: (e) => console.error("Live error", e),
        onclose: () => this.stop()
      }
    });
  }

  sendFrame(base64Data: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'image/jpeg' }
        });
      });
    }
  }

  private async playAudio(base64: string) {
    if (!this.outputAudioCtx) return;
    try {
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioCtx.currentTime);
      const buffer = await decodeAudioData(decode(base64), this.outputAudioCtx, 24000, 1);
      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputAudioCtx.destination);
      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      this.sources.add(source);
      source.onended = () => this.sources.delete(source);
    } catch (err) {}
  }

  private stopAllAudio() {
    this.sources.forEach(s => { try { s.stop(); } catch(e) {} });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  private createBlob(data: Float32Array): Blob {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  stop() {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => { try { session.close(); } catch(e) {} });
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(t => t.stop());
      this.audioStream = null;
    }
    this.stopAllAudio();
    if (this.inputAudioCtx) this.inputAudioCtx.close();
    if (this.outputAudioCtx) this.outputAudioCtx.close();
  }
}
