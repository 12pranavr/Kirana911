const express = require('express');
const router = express.Router();
const { chatWithAudio } = require('../services/geminiService');
const { chatWithGemini } = require('../services/geminiService');
const supabase = require('../services/supabaseClient');
const { buildChatContext } = require('../services/chatContext');

router.post('/chat', async (req, res) => {
    try {
        console.log('=== Audio Chat Request ===');
        
        // Get user's store information
        let userStore = null;
        try {
            const getUserStore = require('../utils/getUserStore');
            userStore = await getUserStore(req);
            console.log('User store info:', userStore);
        } catch (authError) {
            // If no auth, continue without filtering (backward compatibility)
            console.log('No authentication provided, continuing without store filtering');
        }
        
        // Check if we have audio data
        if (!req.files || !req.files.audio) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const audioFile = req.files.audio;
        console.log('Audio file received:', audioFile.name, audioFile.mimetype);

        // Step 1: Process the audio file with Gemini to get transcription
        // Use a timeout to prevent long delays
        const transcribedText = await Promise.race([
            chatWithAudio(audioFile.data, audioFile.mimetype),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Audio processing timeout')), 10000)
            )
        ]);
        console.log('Audio transcribed to text:', transcribedText);

        // Step 2: Send the transcribed text to the chat model for processing
        // Use the same context as the chat route (filtered by store for owners)
        const context = await buildChatContext(
            userStore && userStore.role === 'owner' && userStore.store_id ? userStore.store_id : null
        );
        const fullMessage = `${context}\n\nUser: ${transcribedText}`;
        
        // Process with the chat model (same as chat route)
        // Add timeout for chat processing as well
        const responseText = await Promise.race([
            chatWithGemini(fullMessage, []),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Chat processing timeout')), 10000)
            )
        ]);
        console.log('Chat model response:', responseText);

        // Save log (with store_id)
        await supabase.from('chat_logs').insert([{
            message: `[Voice] ${transcribedText}`,
            response: responseText,
            timestamp: new Date(),
            store_id: userStore.store_id
        }]);

        console.log('=== Audio Chat Response Sent ===');
        res.json({ response: responseText });

    } catch (error) {
        console.error('=== Audio Chat Error ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // Provide a more user-friendly error message
        const userMessage = error.message.includes('timeout') 
            ? 'Sorry, that took too long to process. Please try a shorter question.'
            : 'Sorry, I had trouble processing your voice message. Please try again.';
            
        res.status(500).json({
            error: userMessage,
            details: error.message
        });
    }
});

// New endpoint for text-to-speech conversion
router.post('/tts', async (req, res) => {
    try {
        console.log('=== Text-to-Speech Request ===');
        
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        // For now, we'll just return the text as is
        // In a full implementation, we would convert text to speech here
        res.json({ 
            text: text,
            audioUrl: null // Placeholder for actual audio URL
        });

    } catch (error) {
        console.error('=== TTS Error ===');
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Text-to-speech failed.',
            details: error.message
        });
    }
});

module.exports = router;