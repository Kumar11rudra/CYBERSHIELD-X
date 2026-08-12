import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Shield, Loader, Activity, Sparkles } from 'lucide-react';
import axios from 'axios';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi. Welcome to Cyber Shield X. I am your Security Copilot. I have audited the system. How can I assist you today?"
};

const QUICK_PROMPTS = [
  "Which tool maps subdomains?",
  "Check if my domain has expiring SSL",
  "Explain what a UPI VPA check is",
  "How do I secure HTTP headers?"
];

export default function SecurityCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [isAiOffline, setIsAiOffline] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasOpened(true);
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chatbot/chat', {
        messages: [...messages, userMessage]
      });

      if (response.data && response.data.content) {
        const reply = response.data.content;
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        
        // Detect offline fallback indicator
        if (reply.includes("currently offline") || reply.includes("GEMINI_API_KEY")) {
          setIsAiOffline(true);
        } else {
          setIsAiOffline(false);
        }
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "⚠️ System warning: Connection to Nexus Core lost. Please check your network or try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#00bfff] text-white shadow-[0_0_20px_rgba(0,191,255,0.4)] flex items-center justify-center z-50 border border-[#00bfff]/50 hover:shadow-[0_0_30px_rgba(0,191,255,0.6)] transition-shadow"
      >
        {isOpen ? <X size={24} /> : <Bot size={28} />}
        
        {/* Notification dot if hasn't opened yet */}
        {!hasOpened && !isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[380px] h-[550px] max-h-[80vh] max-w-[calc(100vw-3rem)] bg-[#0a1223]/95 backdrop-blur-xl border border-[#00bfff]/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#00bfff]/20 bg-gradient-to-r from-[#020814] to-[#0d1b32] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#00bfff]/10 flex items-center justify-center border border-[#00bfff]/30">
                    <Shield size={20} className="text-[#00bfff]" />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full shadow-[0_0_8px] ${
                    isAiOffline ? 'bg-amber-500 shadow-amber-500' : 'bg-green-500 shadow-green-500'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs tracking-wide">Nexus Security Copilot</h3>
                  <div className="flex items-center gap-1.5">
                    <Activity size={10} className={isAiOffline ? 'text-amber-400' : 'text-green-400 animate-pulse'} />
                    <p className={`text-[8px] font-mono tracking-widest uppercase ${
                      isAiOffline ? 'text-amber-400' : 'text-green-400'
                    }`}>
                      {isAiOffline ? 'Offline / Sandbox mode' : 'Cognitive Link Online'}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={toggleChat} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#00bfff] text-white rounded-br-none' 
                        : 'bg-white/5 text-slate-200 border border-white/10 rounded-bl-none'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <Bot size={12} className="text-[#00bfff]" />
                        <span className="text-[10px] uppercase tracking-wider text-[#00bfff]/80 font-bold">Nexus AI</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap font-mono leading-relaxed text-[11px]" 
                         dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\n/g, '<br/>') }} 
                    />
                  </div>
                </div>
              ))}

              {/* Quick Actions Prompts (visible only when there are no user messages yet) */}
              {messages.length === 1 && !isLoading && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-1.5 text-cyber-muted font-mono text-[9px] uppercase tracking-widest px-1">
                    <Sparkles size={10} className="text-cyber-accent" />
                    <span>Quick Audits suggestions:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="text-left w-full px-3 py-2 text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:border-cyber-accent hover:bg-cyber-accent/5 transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-3">
                    <Loader size={14} className="text-[#00bfff] animate-spin" />
                    <span className="text-xs text-slate-400 font-mono">Analyzing vectors...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#060c18] border-t border-[#00bfff]/20">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the Security Copilot..."
                  disabled={isLoading}
                  className="w-full bg-[#0a1223] border border-[#00bfff]/30 text-white rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff]/50 disabled:opacity-50 text-xs font-mono transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 text-[#00bfff] hover:text-white hover:bg-[#00bfff]/20 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#00bfff]"
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="text-center mt-2">
                <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">
                  End-to-End Encrypted Neural Link
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
