import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 180;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt, imageUrl, mode } = await req.json();
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey });
    
    let mediaUrl = "";
    let mediaType: 'image' | 'video' | 'audio' | null = null;
    let textResponse = "";

    console.log(`[AI Studio] Processing Mode: ${mode}`);

    // --- HELPER: PHOTOGRAPHIC TWIN BRIDGE ---
    const enhancePromptWithVision = async (userPrompt: string, imageBase64?: string) => {
        if (imageBase64) {
            console.log("   -> Vision Bridge: analyzing image identity...");
            const vision = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [
                    { text: "Analyze this image. Describe the subject's exact facial features, age, clothing, lighting conditions, and background texture. Be highly specific to ensure a reconstruction matches this identity exactly." },
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
                ]
            });
            const description = vision.candidates?.[0]?.content?.parts?.[0]?.text || "";
            
            return `Create a high-fidelity photorealistic image matching this specific visual description: ${description}. 
            
            Modification request: ${userPrompt}. 
            
            Constraint: Maintain the subject's identity and the original photographic style (lighting, camera angle) as closely as possible. 8k resolution.`;
        }
        return userPrompt;
    };

    switch (mode) {
        
        // --- 1. STORYTELLER (Text) ---
        case 'text':
            const textResult = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt
            });
            textResponse = textResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
            break;

        // --- 2. SNAP (Nano Banana) ---
        case 'image-fast':
            console.log("Routing to Snap (Nano Banana)...");
            
            const snapB64 = imageUrl ? imageUrl.split(',')[1] : undefined;
            let snapContents = [];

            if (snapB64) {
                snapContents.push({ text: `Edit this input image. Modification: ${prompt}. Maintain the exact details, lighting, and identity of the original image. Output must be photorealistic.` });
                snapContents.push({ inlineData: { mimeType: "image/jpeg", data: snapB64 } });
            } else {
                snapContents.push({ text: prompt });
            }

            try {
                const snapGen = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image', 
                    contents: snapContents,
                    config: { responseModalities: ["IMAGE"] }
                });

                const snapPart = snapGen.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                if (snapPart?.inlineData) {
                    mediaUrl = `data:${snapPart.inlineData.mimeType};base64,${snapPart.inlineData.data}`;
                    mediaType = 'image';
                    textResponse = "Snapshot captured.";
                } else {
                    throw new Error("No image returned.");
                }
            } catch (e: any) {
                 console.warn("Falling back to Gemini 2.0 Exp...");
                 const fallbackGen = await ai.models.generateContent({
                    model: 'gemini-2.0-flash-exp-image-generation',
                    contents: snapContents,
                    config: { responseModalities: ["IMAGE"] }
                });
                const fallbackPart = fallbackGen.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                if (fallbackPart?.inlineData) {
                    mediaUrl = `data:${fallbackPart.inlineData.mimeType};base64,${fallbackPart.inlineData.data}`;
                    mediaType = 'image';
                    textResponse = "Snapshot captured (Fallback).";
                } else {
                    throw new Error(`Snap failed: ${e.message}`);
                }
            }
            break;

        // --- 3. INSTANT (Nano Banana Pro) ---
        case 'image-turbo':
            console.log("Routing to Instant (Nano Banana Pro)...");
            
            const instantB64 = imageUrl ? imageUrl.split(',')[1] : undefined;
            let instantContents = [];
            
            if (instantB64) {
                instantContents.push({ text: `Modify this specific image. Request: ${prompt}. Keep the result photorealistic and retain the subject's original appearance/identity.` });
                instantContents.push({ inlineData: { mimeType: "image/jpeg", data: instantB64 } });
            } else {
                instantContents.push({ text: prompt });
            }

            try {
                const instantGen = await ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview', 
                    contents: instantContents,
                    config: { responseModalities: ["IMAGE"] }
                });

                const instantPart = instantGen.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                if (instantPart?.inlineData) {
                    mediaUrl = `data:${instantPart.inlineData.mimeType};base64,${instantPart.inlineData.data}`;
                    mediaType = 'image';
                    textResponse = "Professional asset created.";
                } else {
                    throw new Error("No image returned.");
                }
            } catch (e: any) {
                console.warn("Falling back to Imagen Fast...");
                // FIX: Added 'as any' to bypass the TypeScript error for personGeneration
                const fallbackImg = await ai.models.generateImages({
                    model: 'imagen-4.0-fast-generate-001',
                    prompt: prompt,
                    config: { 
                        numberOfImages: 1, 
                        aspectRatio: "16:9", 
                        personGeneration: "ALLOW_ADULT" 
                    } as any 
                });
                const fbB64 = fallbackImg.generatedImages?.[0]?.image?.imageBytes;
                if (fbB64) {
                    mediaUrl = `data:image/png;base64,${fbB64}`;
                    mediaType = 'image';
                    textResponse = "Instant image ready (Fallback).";
                } else {
                    throw new Error(`Instant failed: ${e.message}`);
                }
            }
            break;

        // --- 4. MASTERPIECE (Imagen 4.0) ---
        case 'image-pro':
            console.log("Routing to Masterpiece (Imagen 4.0)...");
            
            const proB64 = imageUrl ? imageUrl.split(',')[1] : undefined;
            const masterpiecePrompt = await enhancePromptWithVision(prompt, proB64);
            
            // FIX: Added 'as any' to bypass the TypeScript error here too
            const proImg = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001', 
                prompt: masterpiecePrompt,
                config: { 
                    numberOfImages: 1,
                    aspectRatio: "16:9",
                    outputMimeType: "image/jpeg",
                    personGeneration: "ALLOW_ADULT" 
                } as any
            });
            const proOutput = proImg.generatedImages?.[0]?.image?.imageBytes;
            if (proOutput) {
                mediaUrl = `data:image/jpeg;base64,${proOutput}`;
                mediaType = 'image';
                textResponse = "Masterpiece rendering complete.";
            } else {
                throw new Error("Imagen generation failed.");
            }
            break;

        // --- 5. ANALYZER (Visual Reasoning) ---
        case 'visual-reasoning':
            if (!imageUrl) throw new Error("Visual reasoning requires an image.");
            const imageParts = imageUrl.split(',');
            const base64Data = imageParts[1];

            const visionResult = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/png", data: base64Data } }
                ]
            });
            textResponse = visionResult.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis complete.";
            break;

        // --- 6. DIRECTOR (Veo 3.1 Video) ---
        case 'video':
            console.log("Routing to Director (Veo 3.1)...");
            
            const videoInstance: any = { prompt: prompt };
            if (imageUrl) {
                videoInstance.image = {
                    bytesBase64Encoded: imageUrl.split(',')[1],
                    mimeType: "image/png" 
                };
            }

            const veoUrl = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning?key=${apiKey}`;
            
            let startRes = await fetch(veoUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instances: [videoInstance] })
            });
            
            let startData = await startRes.json();
            
            if (!startRes.ok) {
                const errorMsg = startData.error?.message || "";
                if (errorMsg.includes("image") || errorMsg.includes("bytes")) {
                    console.warn("Image payload rejected. Retrying text-only...");
                    startRes = await fetch(veoUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ instances: [{ prompt: prompt }] })
                    });
                    startData = await startRes.json();
                }
                if (!startRes.ok) throw new Error(startData.error?.message || "Veo Launch Failed");
            }

            let opName = startData.name;
            console.log(`Director Operation Started: ${opName}`);

            let finished = false;
            let attempts = 0;
            
            // Helper function to recursively search for URI in response
            const findVideoUri = (obj: any, depth = 0): string | null => {
                if (depth > 10) return null; // Prevent infinite recursion
                if (!obj || typeof obj !== 'object') return null;
                
                // Check if this object has a 'uri' property
                if (obj.uri && typeof obj.uri === 'string' && obj.uri.length > 0) {
                    return obj.uri;
                }
                
                // Check if this object has a 'video' property with uri
                if (obj.video?.uri && typeof obj.video.uri === 'string') {
                    return obj.video.uri;
                }
                
                // Recursively search in all properties
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const result = findVideoUri(obj[key], depth + 1);
                        if (result) return result;
                    }
                }
                
                return null;
            };
            
            while (!finished && attempts < 60) {
                attempts++;
                await new Promise(r => setTimeout(r, 3000));
                
                const pollRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${opName}?key=${apiKey}`);
                
                if (!pollRes.ok) {
                    const errorData = await pollRes.json().catch(() => ({}));
                    console.error(`[Video Poll ${attempts}] HTTP ${pollRes.status}:`, errorData);
                    if (attempts >= 10) {
                        throw new Error(`Polling failed after ${attempts} attempts: ${errorData.error?.message || pollRes.statusText}`);
                    }
                    continue; // Retry on HTTP errors
                }
                
                const pollData = await pollRes.json();

                if (pollData.done) {
                    finished = true;
                    if (pollData.error) {
                        console.error('[Video Generation] Error in response:', pollData.error);
                        throw new Error(`Video generation failed: ${pollData.error.message || JSON.stringify(pollData.error)}`);
                    }
                    
                    // Try multiple known paths first
                    let potentialUri = 
                        pollData.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
                        pollData.response?.generateVideoResponse?.generatedSamples?.[0]?.uri ||
                        pollData.response?.generatedVideos?.[0]?.video?.uri ||
                        pollData.response?.generatedVideos?.[0]?.uri ||
                        pollData.response?.video?.uri ||
                        pollData.metadata?.outputUri ||
                        pollData.outputUri ||
                        pollData.uri;

                    // If not found in known paths, recursively search the entire response
                    if (!potentialUri) {
                        console.warn('[Video Generation] URI not found in known paths, searching entire response...');
                        console.log('[Video Generation] Full response structure:', JSON.stringify(pollData, null, 2));
                        potentialUri = findVideoUri(pollData);
                    }

                    if (potentialUri) {
                        // Ensure the URI has the API key for authentication
                        mediaUrl = potentialUri.includes('key=') 
                            ? potentialUri 
                            : `${potentialUri}${potentialUri.includes('?') ? '&' : '?'}key=${apiKey}`;
                        mediaType = 'video';
                        textResponse = "Cinematic sequence finalized.";
                        console.log(`[Video Generation] Success! Video URI found: ${potentialUri.substring(0, 100)}...`);
                    } else {
                        // Log the full response for debugging
                        console.error('[Video Generation] URI not found. Full response:', JSON.stringify(pollData, null, 2));
                        throw new Error(`Video completed but URI was not found in response. Response structure may have changed. Check logs for details.`);
                    }
                } else {
                    // Log progress every 10 attempts
                    if (attempts % 10 === 0) {
                        console.log(`[Video Generation] Still processing... (attempt ${attempts}/60)`);
                    }
                }
            }
            
            if (!finished) {
                throw new Error("Video generation timed out after 60 polling attempts (3 minutes).");
            }
            break;

        default:
            throw new Error("Invalid Mode Selected");
    }

    return NextResponse.json({ text: textResponse, mediaUrl, mediaType });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ text: `System Error: ${error.message}` }, { status: 500 });
  }
}