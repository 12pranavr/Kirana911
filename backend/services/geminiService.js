const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelPro = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using gemini-2.5-flash for text
const modelVision = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Using gemini-2.5-flash for vision
// Removed ALMI model

async function chatWithGemini(message, history = []) {
    try {
        console.log('Gemini API Key present:', !!process.env.GEMINI_API_KEY);
        console.log('API Key prefix:', process.env.GEMINI_API_KEY?.substring(0, 10));

        // Format history for Gemini API
        // Gemini expects alternating user/model messages, starting with user
        const formattedHistory = [];
        
        // Process history pairs (user then model)
        for (let i = 0; i < history.length; i += 2) {
            // Add user message
            if (i < history.length && history[i].role === 'user') {
                formattedHistory.push({
                    role: 'user',
                    parts: [{ text: history[i].parts[0].text }]
                });
            }
            
            // Add model message
            if (i + 1 < history.length && history[i + 1].role === 'model') {
                formattedHistory.push({
                    role: 'model',
                    parts: [{ text: history[i + 1].parts[0].text }]
                });
            }
        }

        const chat = modelPro.startChat({
            history: formattedHistory,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini response received successfully');
        return text;
    } catch (error) {
        console.error("Gemini Chat Error Details:");
        console.error("- Error name:", error.name);
        console.error("- Error message:", error.message);
        console.error("- Error code:", error.code);
        console.error("- Full error:", error);

        // Throw the error so the calling function can handle it properly
        throw new Error(`Gemini API Error: ${error.message}`);
    }
}

async function chatWithAudio(audioBuffer, mimeType) {
    try {
        console.log('Processing audio with Gemini model');
        
        // For now, we'll convert the audio to text manually and then process it
        // Since the specific audio model isn't working, we'll use the main model
        // and instruct it to handle audio data
        
        // Create the audio part for the model
        const audioPart = {
            inlineData: {
                data: audioBuffer.toString('base64'),
                mimeType: mimeType
            }
        };

        // Use the main model to process the audio
        const prompt = "Please transcribe this audio and respond appropriately. If it's a question, answer it. If it's a command, follow it.";
        
        const result = await modelPro.generateContent([
            prompt,
            audioPart
        ]);
        
        const response = await result.response;
        const text = response.text();

        console.log('Gemini audio response received successfully');
        return text;
    } catch (error) {
        console.error("Gemini Audio Error Details:");
        console.error("- Error name:", error.name);
        console.error("- Error message:", error.message);
        console.error("- Error code:", error.code);
        console.error("- Full error:", error);

        // Throw the error so the calling function can handle it properly
        throw new Error(`Gemini Audio API Error: ${error.message}`);
    }
}

// Removed almWithGemini function

async function analyzeImage(imageBuffer, mimeType) {
    try {
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimeType
            },
        };

        const prompt = `
      Analyze this bill image. Extract the following details in strict JSON format:
      {
        "date": "YYYY-MM-DD",
        "items": [
          {
            "name": "Product Name",
            "qty": 1,
            "unit_price": 10.0,
            "total": 10.0
          }
        ],
        "total_amount": 100.0
      }
      If the date is missing, use today's date. Ensure all numbers are floats or integers.
    `;

        const result = await modelVision.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        throw new Error("Failed to analyze image");
    }
}

// Removed almWithGemini from module exports
module.exports = { chatWithGemini, chatWithAudio, analyzeImage };