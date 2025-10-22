import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '../types';
import Button from './ui/Button';
import { useTranslation } from '../hooks/useTranslation';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSession: ChatSession | undefined;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onSwitchChat: (sessionId: string) => void;
  onSendMessage: (message: string, useGoogleSearch: boolean) => void;
  isAiReplying: boolean;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

// FIX: Define the ChatIcon component to resolve the "Cannot find name 'ChatIcon'" error.
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, sessions, activeSession, onNewChat, onDeleteChat, onSwitchChat, onSendMessage, isAiReplying }) => {
    const { t, t_html } = useTranslation();
    const [message, setMessage] = useState('');
    const [useGoogleSearch, setUseGoogleSearch] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeSession?.history, isAiReplying]);

    if (!isOpen) return null;

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isAiReplying) {
            onSendMessage(message, useGoogleSearch);
            setMessage('');
        }
    };
    
    const handleDelete = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (window.confirm(t_html('chatbotDeleteConfirm'))) {
            onDeleteChat(sessionId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full h-full max-w-4xl flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold">{t('chatbotTitle')}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 text-3xl leading-none">&times;</button>
                </header>

                <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                    {/* Sidebar */}
                    <aside className="w-full md:w-1/3 md:min-w-[200px] bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col h-1/3 md:h-auto flex-shrink-0">
                        <Button onClick={onNewChat} variant="secondary" className="w-full mb-4">{t('chatbotNewChat')}</Button>
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('chatbotConversations')}</h3>
                        <div className="overflow-y-auto flex-grow pr-2 -mr-2">
                            {sessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => onSwitchChat(session.id)}
                                    className={`flex justify-between items-center p-2 rounded-md cursor-pointer mb-1 ${activeSession?.id === session.id ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    <p className="text-sm truncate flex-grow text-slate-700 dark:text-slate-300">{session.title}</p>
                                    <button onClick={(e) => handleDelete(e, session.id)} className="text-slate-400 hover:text-red-500 ml-2 flex-shrink-0">
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Main Chat Area */}
                    <main className="flex-grow flex flex-col overflow-hidden">
                        {activeSession ? (
                            <>
                                <div className="flex-grow p-4 overflow-y-auto">
                                    <div className="space-y-4">
                                        {activeSession.history.map((msg, index) => (
                                            <div key={msg.id || `msg-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                                                    <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                                                    {msg.role === 'model' && msg.grounding && msg.grounding.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                                                            <h4 className="text-xs font-semibold mb-1">{t('chatbotSources')}</h4>
                                                            <ul className="text-xs space-y-1">
                                                                {msg.grounding.map((source, i) => (
                                                                    <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline truncate block">{source.title || source.uri}</a></li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isAiReplying && activeSession.history[activeSession.history.length-1]?.parts[0].text === '' && (
                                            <div className="flex justify-start">
                                                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 animate-pulse">
                                                    {t('chatbotThinking')}
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                    <form onSubmit={handleSendMessage} className="flex items-start gap-2">
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            placeholder={t_html('chatbotPlaceholder')}
                                            className="w-full p-2 border border-slate-300 rounded-md bg-white dark:bg-slate-600 dark:border-slate-500 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                            rows={2}
                                            disabled={isAiReplying}
                                        />
                                        <Button type="submit" isLoading={isAiReplying} disabled={!message.trim()}>Send</Button>
                                    </form>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            id="google-search-toggle"
                                            checked={useGoogleSearch}
                                            onChange={(e) => setUseGoogleSearch(e.target.checked)}
                                        />
                                        <label htmlFor="google-search-toggle" className="text-xs text-slate-600 dark:text-slate-400">{t('chatbotUseSearch')}</label>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <ChatIcon />
                                <h3 className="mt-4 text-lg font-semibold">{t('chatbotWelcome')}</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md">{t('chatbotWelcomeSubtext')}</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;