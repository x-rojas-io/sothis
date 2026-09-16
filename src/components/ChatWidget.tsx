'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    whatsappLink?: string;
};

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export default function ChatWidget() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const t = useTranslations('ChatWidget');
    const [isOpen, setIsOpen] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    // Initial message state defined here to be reused for reset
    const initialMessage: Message = {
        role: 'assistant',
        content: t('initialMessage')
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
                if (data.isFallback) {
                    const waMsgText = t('prefilledMessagePrefix', { message: userMessage });
                    const waLink = `https://wa.me/15512414652?text=${encodeURIComponent(waMsgText)}`;
                    setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: data.reply,
                        whatsappLink: waLink
                    }]);
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
                }
            } else {
                const waMsgText = t('prefilledMessagePrefix', { message: userMessage });
                const waLink = `https://wa.me/15512414652?text=${encodeURIComponent(waMsgText)}`;
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: t('errorMessage'),
                    whatsappLink: waLink
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const waMsgText = t('prefilledMessagePrefix', { message: userMessage });
            const waLink = `https://wa.me/15512414652?text=${encodeURIComponent(waMsgText)}`;
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: t('errorMessage'),
                whatsappLink: waLink
            }]);
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
                                        <div>{msg.content}</div>
                                        {msg.whatsappLink && (
                                            <div className="mt-3">
                                                <a
                                                    href={msg.whatsappLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer animate-pulse"
                                                >
                                                    {/* WhatsApp Brand SVG */}
                                                    <svg
                                                        className="w-4 h-4 fill-current"
                                                        viewBox="0 0 24 24"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                    {t('whatsappButton')}
                                                </a>
                                            </div>
                                        )}
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
