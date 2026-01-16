const { GoogleGenAI } = require("@google/genai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ No API Key found.");
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey: apiKey });

async function listModels() {
  console.log("🔍 Scanning for Media Models...\n");
  try {
    const response = await client.models.list();
    
    // FIX: Access the hidden 'pageInternal' array we found in the debug step
    const models = response.pageInternal || [];

    if (models.length === 0) {
      console.log("⚠️ No models returned.");
      return;
    }

    // Filter for the interesting ones (Video, Image, Audio)
    const mediaModels = models.filter(m => 
      m.name.includes('veo') || 
      m.name.includes('imagen') || 
      m.name.includes('gemini-2.0') || // Often has experimental features
      m.name.includes('lyria')
    );

    console.log("✅ YOUR AVAILABLE MEDIA MODELS:");
    if (mediaModels.length === 0) {
        console.log("   (No specialized media models found. You may only have Text access.)");
    } else {
        mediaModels.forEach(m => {
            console.log(`- ${m.name.replace('models/', '')}`);
        });
    }
    
    console.log("\n(If 'imagen-3.0-generate-001' is missing, that explains the 404 error!)");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

listModels();