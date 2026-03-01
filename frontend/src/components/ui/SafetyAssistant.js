// frontend/src/components/ui/SafetyAssistant.js
import React, { useState, useRef, useEffect } from 'react';

// This is the new typing indicator component
const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
    </div>
);

const Markdown = ({ content }) => {
    const formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\s*-\s/g, '<br>- ')
        .replace(/\n/g, '<br />');
    return <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: formattedContent }} />;
};

const SafetyAssistant = ({ crimeContext }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 0, sender: 'ai', text: 'Hi there! Ask me a question or choose a suggestion below.' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const sendMessage = async (messageText) => {
        if (!messageText.trim() || isLoading) return;

        const newUserMessage = { id: Date.now(), sender: 'user', text: messageText };
        const newAiMessagePlaceholder = { id: Date.now() + 1, sender: 'ai', text: '' };

        setMessages(prev => [...prev, newUserMessage, newAiMessagePlaceholder]);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/safety-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText, crime_context: crimeContext }),
            });

            if (!response.body) return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                setMessages(prevMessages =>
                    prevMessages.map(msg =>
                        msg.id === newAiMessagePlaceholder.id
                            ? { ...msg, text: msg.text + chunk }
                            : msg
                    )
                );
            }
        } catch (error) {
            console.error("Failed to get safety tip:", error);
            setMessages(prev => prev.map(msg =>
                msg.id === newAiMessagePlaceholder.id
                    ? { ...msg, text: 'Sorry, I seem to be having trouble right now. Please try again later.' }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        sendMessage(userInput);
    };

    const chatWidgetStyle = { zIndex: 1000 };
    const floatingButtonStyle = { zIndex: 999 };

    return (
        <>
            <div style={chatWidgetStyle} className={`fixed bottom-24 right-4 md:right-8 bg-white rounded-lg shadow-2xl w-[calc(100%-2rem)] max-w-sm h-[32rem] flex flex-col transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                    <h3 className="font-bold text-lg">AI Safety Assistant</h3>
                    <button onClick={() => setIsOpen(false)} className="text-2xl leading-none">&times;</button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto bg-gray-50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`py-3 px-4 rounded-lg max-w-xs text-sm shadow-md ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
                                {/* THE FIX: Show the TypingIndicator if the message is from the AI, the text is empty, and we are loading. */}
                                {msg.sender === 'ai' && msg.text === '' && isLoading ? (
                                    <TypingIndicator />
                                ) : (
                                    <Markdown content={msg.text} />
                                )}
                            </div>
                        </div>
                    ))}
                    {messages.length <= 1 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button onClick={() => sendMessage("Give me general safety tips")} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-200">General tips</button>
                            <button onClick={() => sendMessage("How can I protect my vehicle?")} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-200">Vehicle safety</button>
                            <button onClick={() => sendMessage("What should I do if I feel unsafe?")} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-200">Feeling unsafe</button>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleFormSubmit} className="p-4 border-t bg-white rounded-b-lg">
                    <div className="flex">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask a specific question..."
                            className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700 disabled:bg-gray-400" disabled={isLoading}>
                            Send
                        </button>
                    </div>
                </form>
            </div>
            <button style={floatingButtonStyle} onClick={() => setIsOpen(!isOpen)} className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300" aria-label="Toggle safety assistant">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
        </>
    );
};

export default SafetyAssistant;