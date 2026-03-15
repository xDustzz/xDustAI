import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { Message, Role, Language, Attachment } from "../types";

// SECURITY BEST PRACTICE:
// The API key is securely retrieved from the environment variable 'process.env.API_KEY'.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// QUOTA & ERROR PREVENTION CONFIGURATION
// 1. Context Window: Limit to last 10 messages to save tokens.
const MAX_HISTORY_LENGTH = 10;

// 2. Chat Model Fallback Chain
// We try these in order. If the primary 'preview' model fails (404/503), we try the stable ones.
const CHAT_MODELS = [
  'gemini-3-flash-preview',  // Primary: Latest Preview
  'gemini-flash-latest',     // Fallback 1: Stable Flash
  'gemini-2.0-flash-exp'     // Fallback 2: Experimental Flash
];

// 3. Image Model Fallback Chain
// We try these in order. If one hits a quota limit (429), we try the next.
const IMAGE_MODELS = [
  'gemini-2.5-flash-image',       // Primary: Fast & Standard
  'imagen-3.0-generate-001',      // Fallback 1: Imagen 3 (Different quota bucket)
  'gemini-3-pro-image-preview',   // Fallback 2: High Capabilities
];

// Map codes to English names
const LANGUAGE_MAP: Record<Language, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
  zh: 'Chinese (Simplified)',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
  pt: 'Portuguese',
  ar: 'Arabic',
  hi: 'Hindi'
};

const BASE_SYSTEM_INSTRUCTION = `
You are xDustAI, a state-of-the-art intelligent AI assistant created by xDustzz's (Dustine).

**Operational Directives:**
1.  **Identity**: You are xDustAI. You are helpful, smart, and futuristic.
2.  **Capabilities**: You can reason, code, and generate images.
3.  **Image Generation**: If the user asks to "draw", "paint", or "create an image", you MUST use the \`generate_image\` tool. You can now specify aspect ratios (1:1, 3:4, 4:3, 9:16, 16:9). Infer the best ratio from the user's request (e.g., "portrait" -> 9:16, "landscape" -> 16:9, "wallpaper" -> 16:9). Default to 1:1 if unspecified.
4.  **Structured Data**: When presenting lists of data, comparisons, specs, or structured information, use Markdown tables.
5.  **Language**: Adapt to the user's language preference. If the user ask you about "can you speak ... language" you can tell them the language setting are in the settings menu.
6.  **Feedback**: If the user told you that they want to give a feedback, you can tell the user that the user can give feedback in the settings menu and scan the qr code there.
7:  **Settings**: If users ask about settings, point them to the button beside 'delete chat' button to manage language, feedback, themes, accounts, and view credits.
`;

const decodeBase64ToString = (base64: string): string => {
    try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        return "";
    }
};

const isInlineBlobSupported = (mimeType: string): boolean => {
    return mimeType.startsWith('image/') || 
           mimeType === 'application/pdf' || 
           mimeType.startsWith('audio/') || 
           mimeType.startsWith('video/');
};

// Watermark function - Optimized for Mobile/.exe wrappers
// FAILSAFE: If canvas operations fail (common in restrictive .exe/apk environments), it returns original base64.
const addWatermark = async (base64: string, text: string): Promise<string> => {
  if (typeof document === 'undefined') return base64;

  const watermarkPromise = new Promise<string>((resolve) => {
    try {
        const img = new Image();
        // Crucial for some WebView environments
        img.crossOrigin = "anonymous"; 
        
        img.onload = () => {
          try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(base64); return; }

              ctx.drawImage(img, 0, 0);

              const fontSize = Math.max(24, img.width * 0.05);
              ctx.font = `bold ${fontSize}px "Outfit", sans-serif`;
              ctx.textAlign = 'right';
              ctx.textBaseline = 'bottom';
              const x = img.width - (fontSize * 0.8);
              const y = img.height - (fontSize * 0.8);

              ctx.shadowColor = "rgba(0,0,0,0.5)";
              ctx.shadowBlur = 4;
              ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
              ctx.fillText(text, x, y);
              
              resolve(canvas.toDataURL('image/png').split(',')[1]);
          } catch (e) { 
              // If canvas is tainted or security blocks it, return original
              console.warn("Watermark failed (Canvas security), returning original.");
              resolve(base64); 
          }
        };
        img.onerror = () => resolve(base64);
        img.src = `data:image/png;base64,${base64}`;
    } catch (e) { resolve(base64); }
  });

  return Promise.race([
      watermarkPromise, 
      new Promise<string>(r => setTimeout(() => r(base64), 2000)) // Increased timeout slightly
  ]);
};

// --- IMAGE GENERATION LOGIC ---
const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
    const errors: any[] = [];
    
    // Loop through available models to find one that works (Fallback Strategy)
    for (const model of IMAGE_MODELS) {
        try {
            console.log(`[xDustAI] Attempting generation with ${model} (Ratio: ${aspectRatio})...`);
            let base64Data = "";

            if (model.includes('imagen')) {
                // Imagen Models
                const response = await ai.models.generateImages({
                    model: model,
                    prompt: prompt,
                    config: { 
                        numberOfImages: 1, 
                        outputMimeType: 'image/png',
                        aspectRatio: aspectRatio 
                    }
                });
                base64Data = response.generatedImages?.[0]?.image?.imageBytes || "";
            } else {
                // Gemini Models
                const response = await ai.models.generateContent({
                    model: model,
                    contents: { parts: [{ text: prompt }] },
                    config: { imageConfig: { aspectRatio: aspectRatio } }
                });
                
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData?.data) {
                            base64Data = part.inlineData.data;
                            break;
                        }
                    }
                }
            }

            if (base64Data) {
                return base64Data;
            }

        } catch (error: any) {
            console.warn(`[xDustAI] Model ${model} failed: ${error.message}`);
            errors.push(error);

            if (error.message?.includes("403") || error.message?.includes("PERMISSION_DENIED") || error.message?.includes("400")) {
                throw new Error("API_KEY_RESTRICTED");
            }
        }
    }

    const isQuotaError = errors.some(e => e.message && (e.message.includes('429') || e.message.includes('quota')));
    const isKeyError = errors.some(e => e.message === "API_KEY_RESTRICTED");
    
    if (isQuotaError) throw new Error("QUOTA_EXCEEDED");
    if (isKeyError) throw new Error("API_KEY_RESTRICTED");

    throw new Error(errors[0]?.message || "All image generation models failed.");
};

interface GeminiResponse {
  text: string;
  generatedAttachments?: Attachment[];
}

// --- MAIN SERVICE ---
export const sendMessageToGemini = async (
  history: Message[],
  currentMessage: string,
  language: Language,
  attachments?: Attachment[],
  onStatusChange?: (status: string) => void,
  checkImageLimit?: () => Promise<boolean>
): Promise<GeminiResponse> => {
  
  // 1. OPTIMIZE HISTORY
  const recentHistory = history.slice(-MAX_HISTORY_LENGTH);
  
  const chatHistory = recentHistory
    .filter(msg => (msg.text && msg.text.trim().length > 0) || (msg.attachments && msg.attachments.length > 0))
    .map((msg) => {
      const parts: any[] = [];
      let msgText = msg.text || "";

      if (msg.role === Role.USER && msg.attachments && msg.attachments.length > 0) {
          msg.attachments.forEach(att => {
             msgText += `\n[Reference to previous attachment: ${att.name}]`;
          });
      }

      if (msgText.trim().length > 0) parts.push({ text: msgText });
      if (parts.length === 0) parts.push({ text: "." });

      return {
          role: msg.role === Role.USER ? 'user' : 'model',
          parts: parts
      };
    });

  const targetLanguage = LANGUAGE_MAP[language] || 'English';
  const finalSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}\n**LANGUAGE**: Communicate in ${targetLanguage}.`;

  const generateImageTool: FunctionDeclaration = {
      name: "generate_image",
      description: "Generates an image based on the prompt and aspect ratio.",
      parameters: {
          type: Type.OBJECT,
          properties: {
              prompt: { type: Type.STRING, description: "Descriptive English prompt for the image." },
              aspectRatio: {
                  type: Type.STRING,
                  enum: ["1:1", "3:4", "4:3", "9:16", "16:9"],
                  description: "The aspect ratio of the image. Default is '1:1'."
              }
          },
          required: ["prompt"]
      }
  };

  const messageParts: any[] = [];
  let currentText = currentMessage || "";

  if (attachments && attachments.length > 0) {
      for (const att of attachments) {
           if (isInlineBlobSupported(att.mimeType)) {
              messageParts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
           } else {
               const decoded = decodeBase64ToString(att.base64);
               currentText += `\n\n[Attachment: ${att.name}]\n\`\`\`\n${decoded}\n\`\`\`\n`;
           }
      }
  }
  if (currentText.trim().length > 0) messageParts.push({ text: currentText });
  if (messageParts.length === 0) return { text: "" };

  // --- API CALL WITH TIMEOUT ---
  // If the API call hangs for more than 60 seconds (common in .exe network issues), fail gracefully.
  const TIMEOUT_MS = 60000;

  const performChatRequest = async () => {
    let lastError: any = null;

    for (const model of CHAT_MODELS) {
        try {
            const chat = ai.chats.create({
                model: model, 
                config: {
                systemInstruction: finalSystemInstruction,
                tools: [{ functionDeclarations: [generateImageTool] }]
                },
                history: chatHistory
            });

            const result = await chat.sendMessage({ message: messageParts });

            const calls = result.functionCalls;
            if (calls && calls.length > 0) {
                const call = calls[0];
                if (call.name === 'generate_image') {
                    if (checkImageLimit) {
                        const allowed = await checkImageLimit();
                        if (!allowed) {
                            return { text: "⚠️ Image generation limit reached (Session Limit)." };
                        }
                    }

                    if (onStatusChange) onStatusChange("Drawing");
                    const prompt = call.args['prompt'] as string;
                    const aspectRatio = (call.args['aspectRatio'] as string) || "1:1";
                    
                    try {
                        const rawBase64 = await generateImage(prompt, aspectRatio);
                        const finalBase64 = await addWatermark(rawBase64, "xDustAI");
                        
                        return {
                            text: "", 
                            generatedAttachments: [{
                                name: `generated_${Date.now()}.png`,
                                mimeType: 'image/png',
                                base64: finalBase64
                            }]
                        };
                    } catch (imgError: any) {
                        console.error("Image gen failed:", imgError);
                        let userMsg = "⚠️ Image generation failed.";
                        if (imgError.message === "QUOTA_EXCEEDED" || imgError.message.includes("429")) {
                            userMsg = "⚠️ Daily image quota exceeded. The server is busy. Please try again later.";
                        } else if (imgError.message === "API_KEY_RESTRICTED") {
                            userMsg = "⚠️ API Key Error: Your API key is restricted to specific domains. Since this is an App (.exe/.apk), please enable unrestricted access or specific bundle IDs in Google Cloud Console.";
                        } else if (imgError.message.includes("safety")) {
                            userMsg = "⚠️ I cannot generate that specific image due to safety guidelines.";
                        } else {
                            userMsg = `⚠️ Image generation error: ${imgError.message.slice(0, 100)}...`;
                        }
                        return { text: userMsg };
                    }
                }
            }
            return { text: result.text || "" };
        } catch (error: any) {
            console.warn(`[xDustAI] Chat model ${model} failed:`, error);
            lastError = error;
            if (error.message?.toLowerCase().includes("safety") || error.message?.toLowerCase().includes("blocked")) {
                return { text: "⚠️ I cannot answer that due to safety guidelines." };
            }
            if (error.message?.includes("403") || error.message?.includes("PERMISSION_DENIED") || error.message?.includes("400")) {
                return { text: "⚠️ API Key Restriction: Access denied (403/400). Your API key may be restricted to specific domains and cannot be used in this app environment." };
            }
        }
    }
    
    // Fallback error messaging
    if (lastError?.message?.includes("404")) return { text: "⚠️ The AI models are currently unavailable in your region or for your API key." };
    if (lastError?.message?.includes("429")) return { text: "⚠️ System is busy (Rate Limit). Please wait a moment and try again." };
    if (lastError?.message?.includes("fetch") || lastError?.message?.includes("network")) return { text: "⚠️ Network error. Please check your internet connection." };
    
    return { text: "⚠️ Connection error: Unable to reach AI services." };
  };

  // RACE: API Request vs Timeout
  try {
      return await Promise.race([
          performChatRequest(),
          new Promise<GeminiResponse>((_, reject) => 
              setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), TIMEOUT_MS)
          )
      ]);
  } catch (e: any) {
      if (e.message === "REQUEST_TIMEOUT") {
          return { text: "⚠️ Request Timed Out: The AI took too long to respond. This may be due to a slow connection or restrictions in your app environment." };
      }
      return { text: "⚠️ Unexpected System Error." };
  }
};