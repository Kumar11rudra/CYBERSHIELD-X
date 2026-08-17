import React, { useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * CopilotChatConsole Component
 * Handles the AI security copilot chat interface.
 */
export default function CopilotChatConsole({
  recommendations = [],
  chatLogs = [],
  chatInput = '',
  setChatInput,
  selectedModel = 'llama3',
  setSelectedModel,
  isChatting = false,
  onSendChat,
}) {
  const chatEndRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) {
      toast.error('Please enter a query for the AI Copilot.');
      return;
    }
    onSendChat(e);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs]);

  return (
    <div className="lg:col-span-2 flex flex-col border border-cyber-border/10 bg-cyber-card rounded-xl p-4 shadow-sm h-[420px] lg:h-auto">
      {/* Header */}
      <div className="border-b border-cyber-border/10 pb-3 mb-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/bot-avatar.png" alt="Copilot" className="w-5 h-5 rounded-full object-cover border border-cyber-accent/40 shadow-[0_0_8px_rgba(0,212,255,0.4)]" />
          <span className="text-xs font-bold text-cyber-text tracking-widest uppercase">
            AI SECURITY COPILOT
          </span>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-cyber-muted uppercase">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-cyber-surface border border-cyber-border/15 rounded px-2 py-0.5 text-[10px] text-cyber-accent focus:outline-none focus:border-cyber-accent"
          >
            <option value="llama3">Llama 3</option>
            <option value="deepseek-r1">DeepSeek R1</option>
            <option value="mistral">Mistral</option>
          </select>
        </div>
      </div>

      {/* Recommendations Summary */}
      {recommendations.length > 0 && (
        <div className="bg-cyber-red/5 border border-cyber-red/15 rounded-lg p-3 mb-3 max-h-[80px] overflow-y-auto">
          <div className="text-[9px] text-cyber-red font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-red animate-ping" />
            SYSTEM RECOMMENDATIONS & Triages
          </div>
          <ul className="list-disc pl-4 text-[10px] text-cyber-text space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Chat Logs */}
      <div className="flex-1 bg-cyber-surface border border-cyber-border/10 rounded-lg p-3 overflow-y-auto font-mono text-xs flex flex-col gap-3 min-h-[140px]">
        {chatLogs.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg p-2.5 ${
              msg.sender === 'user'
                ? 'bg-cyber-accent/10 border border-cyber-accent/20 self-end text-cyber-accent'
                : 'bg-cyber-card border border-cyber-border/10 self-start text-cyber-text'
            }`}
          >
            <div className="text-[8px] text-cyber-muted uppercase tracking-wider mb-1 font-bold flex items-center gap-1.5">
              {msg.sender === 'user' ? (
                'USER QUERY'
              ) : (
                <>
                  <img src="/bot-avatar.png" alt="AI" className="w-3.5 h-3.5 rounded-full object-cover inline-block" />
                  <span className="text-cyber-accent">COPILOT AGENT</span>
                </>
              )}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
          </div>
        ))}
        {isChatting && (
          <div className="self-start bg-cyber-card border border-cyber-border/10 rounded-lg p-2.5 text-cyber-accent animate-pulse flex items-center gap-2">
            <img src="/bot-avatar.png" alt="AI" className="w-4 h-4 rounded-full object-cover inline-block" />
            <span className="text-[10px] uppercase tracking-widest">
              Typing triage response...
            </span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          id="copilot-query-input"
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask Copilot: 'Explain my SSL status' or 'How can I fix DNS issues?'"
          className="flex-1 bg-cyber-surface border border-cyber-border/15 rounded-lg px-3 py-2 text-xs text-cyber-text focus:outline-none focus:border-cyber-accent focus:ring-2 focus:ring-cyber-accent/15 font-mono"
        />
        <button
          type="submit"
          disabled={isChatting}
          className="px-4 py-2 bg-cyber-accent text-cyber-bg focus:ring-2 focus:ring-cyber-accent/40 font-bold text-xs uppercase tracking-wider rounded-lg transition-all hover:opacity-90"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
