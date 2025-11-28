import React, { useState, useRef } from 'react';
import { MessageSquare, X, Send, Mic, MicOff } from 'lucide-react';
import api from '../services/api';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I am your KIRANA911 Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const sendMessage = async (messageText = input) => {
        if (!messageText.trim()) return;

        const userMsg = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMsg]);
        
        if (messageText === input) {
            setInput('');
        }
        
        setLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

            const res = await api.post('/chat', { message: userMsg.text, history });

            const botMsg = { role: 'assistant', text: res.data.response };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong.' }]);
        } finally {
            setLoading(false);
        }
    };

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendAudioMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsListening(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setMessages(prev => [...prev, { role: 'assistant', text: 'Microphone access denied. Please allow microphone access to use voice features.' }]);
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    };

    const sendAudioMessage = async (audioBlob) => {
        setLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: '[Voice Message]' }]);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const res = await fetch('/api/audio/chat', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                const botMsg = { role: 'assistant', text: data.response };
                setMessages(prev => [...prev, botMsg]);
                
                // Try to convert response to speech
                try {
                    const ttsRes = await fetch('/api/audio/tts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ text: data.response })
                    });
                    
                    const ttsData = await ttsRes.json();
                    console.log('TTS response:', ttsData);
                    // In a full implementation, we would play the audio here
                } catch (ttsError) {
                    console.log('Could not convert to speech:', ttsError);
                }
            } else {
                setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I had trouble processing your voice message.' }]);
            }
        } catch (error) {
            console.error('Error sending audio:', error);
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong with your voice message.' }]);
        } finally {
            setLoading(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all"
                >
                    <MessageSquare className="w-6 h-6" />
                </button>
            )}

            {isOpen && (
                <div className="bg-white rounded-lg shadow-2xl w-80 sm:w-96 flex flex-col h-[500px] border border-gray-200">
                    <div className="bg-primary text-white p-4 rounded-t-lg flex justify-between items-center">
                        <h3 className="font-bold">KIRANA911 Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-br-none'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && <div className="text-xs text-gray-500 italic">Thinking...</div>}
                    </div>

                    <div className="p-4 border-t flex gap-2">
                        <button
                            onClick={toggleListening}
                            className={`${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-200 hover:bg-gray-300'} p-2 rounded-md transition-colors`}
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask me anything..."
                            className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={loading}
                            className="bg-primary text-white p-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;