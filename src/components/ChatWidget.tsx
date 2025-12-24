'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ChatWidget() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    // Initial message state defined here to be reused for reset
    const initialMessage: Message = {
        role: 'assistant',
        content: "Hi! I'm Nancy's virtual assistant. How can I help you regarding our massage services today?"
    };

    const [messages, setMessages] = useState<Message[]>([initialMessage]);

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
        if (isOpen) setShowPrompt(false);
    }, [messages, isOpen]);

    // Show prompt after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isOpen) setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const handleClearChat = () => {
        setMessages([initialMessage]);
        setInput(''); // Also clear any pending input
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });
            const data = await response.json();

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Please check your connection." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Strict Role Check: Hide for Admins/Providers on ALL pages
    const role = (session?.user as any)?.role;
    if (pathname?.includes('/admin') || role === 'admin' || role === 'provider') return null;

    return (
        <>
            {/* Call to Action Bubble */}
            <AnimatePresence>
                {showPrompt && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="fixed bottom-24 right-8 z-50 cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => setIsOpen(true)}
                    >
                        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xl">
                            <img
                                src="/nancy_raza.png"
                                alt="Nancy"
                                className="object-cover w-full h-full scale-150 object-top"
                            />
                        </div>
                        {/* Close prompt button - tiny x badge */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowPrompt(false);
                            }}
                            className="absolute -top-1 -right-1 bg-stone-200 rounded-full p-0.5 shadow-sm hover:bg-stone-300 transition-colors z-10"
                        >
                            <XMarkIcon className="w-3 h-3 text-stone-600" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105
                    ${isOpen ? 'bg-stone-200 text-stone-800 rotate-90' : 'bg-primary text-primary-foreground'}
                `}
                aria-label="Toggle Chat"
            >
                {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleLeftRightIcon className="w-6 h-6" />}
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-[360px] h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-stone-900 text-white p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
                                    <img
                                        src="/nancy_raza.png"
                                        alt="Nancy"
                                        className="object-cover w-full h-full scale-150 object-top"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-lg leading-tight">Chat with Nancy</h3>
                                    <div className="text-xs text-stone-300 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        AI Assistant
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleClearChat}
                                className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition-colors"
                                title="Restart Chat"
                            >
                                <ArrowPathIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`
                                            max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                                            ${msg.role === 'user'
                                                ? 'bg-secondary text-white rounded-br-none'
                                                : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none shadow-sm'
                                            }
                                        `}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-stone-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-stone-100 flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question..."
                                className="flex-1 bg-stone-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-secondary/50 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="p-2 bg-secondary text-white rounded-full hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
