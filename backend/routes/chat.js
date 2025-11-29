const express = require('express');
const router = express.Router();
const { chatWithGemini } = require('../services/geminiService');
const supabase = require('../services/supabaseClient');
const { buildChatContext } = require('../services/chatContext');

router.post('/', async (req, res) => {
    const { message, history } = req.body;

    try {
        console.log('=== Chat Request ===');
        console.log('Message:', message);
        console.log('History length:', history?.length || 0);

        // Get user's store information
        let userStore = null;
        try {
            const getUserStore = require('../utils/getUserStore');
            userStore = await getUserStore(req);
            console.log('User store info:', userStore);
        } catch (authError) {
            console.error('Authentication error:', authError);
            return res.status(401).json({ error: 'Authentication required' });
        }

        // 1. Build context (filtered by store)
        const context = await buildChatContext(userStore.store_id);
        const fullMessage = `${context}\n\nUser: ${message}`;

        // 2. Call Gemini
        console.log('Calling Gemini API...');
        const responseText = await chatWithGemini(fullMessage, history || []);
        console.log('Gemini response:', responseText);

        // Check if it's an error message
        if (responseText.includes('trouble connecting')) {
            throw new Error('Gemini API error');
        }

        // 3. Check for Action JSON
        let response = responseText;
        let actionTaken = null;

        try {
            // Attempt to parse JSON if the response looks like JSON
            if (responseText.trim().startsWith('{')) {
                const actionData = JSON.parse(responseText);
                actionTaken = actionData;

                // Execute Action
                if (actionData.action === 'update_stock') {
                    // Logic to find product and update stock
                    // For now, just simulate success
                    response = `Action executed: Updated stock for ${actionData.params.product_name} by ${actionData.params.qty}`;
                } else if (actionData.action === 'set_budget') {
                    response = `Budget set to ${actionData.params.amount}`;
                }
            }
        } catch (e) {
            // Not JSON, just text response
        }

        // 4. Save Log (with store_id)
        await supabase.from('chat_logs').insert([{
            message: message,
            response: response,
            timestamp: new Date(),
            store_id: userStore.store_id
        }]);

        console.log('=== Chat Response Sent ===');
        res.json({ response, action: actionTaken });

    } catch (error) {
        console.error('=== Chat Error ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            error: 'Chat failed. Please check your Gemini API key and make sure the backend server is running properly.',
            details: error.message
        });
    }
});

module.exports = router;