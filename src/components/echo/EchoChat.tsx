
import React, { useState, useRef, useEffect } from 'react';
import { useEcho } from '../../hooks/useEcho';
import { X, Send, Loader2, Sparkles, Copy, Check, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx';
import { useFileSystem } from '../../store/useFileSystem';

export function EchoChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, sendMessage, isLoading, error } = useEcho();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { activeFile, updateFileContent } = useFileSystem();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApply = (code: string) => {
    if (activeFile) {
        updateFileContent(activeFile, code);
        // Could show a toast here
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-40 transition-all duration-300 hover:scale-110 active:scale-95",
          isOpen ? "scale-0 opacity-0" : "bg-blue-600 hover:bg-blue-500 text-white opacity-100"
        )}
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>

      {/* Chat Window */}
      <div
        className={clsx(
          "fixed z-50 transition-all duration-300 bg-slate-900 border border-slate-800 shadow-2xl flex flex-col",
          // Desktop: Bottom right, fixed size
          "md:bottom-6 md:right-6 md:w-[450px] md:h-[600px] md:rounded-2xl",
          // Mobile: Full screen overlay
          "inset-0 md:inset-auto",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none md:translate-y-20"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
                <Sparkles size={16} />
            </div>
            <div>
                <h3 className="font-bold text-white">Echo AI</h3>
                <p className="text-xs text-slate-400">Smart Contract Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 mt-10 space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles size={32} className="text-blue-500/50" />
                </div>
                <p>How can I help you with your smart contracts today?</p>
                <div className="grid grid-cols-1 gap-2 text-xs text-left max-w-[80%] mx-auto">
                    <button onClick={() => sendMessage("Review my current contract for security vulnerabilities")} className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded border border-slate-800 transition-colors">
                        🛡️ Audit Security
                    </button>
                    <button onClick={() => sendMessage("Optimize the gas usage of my contract")} className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded border border-slate-800 transition-colors">
                        ⛽ Optimize Gas
                    </button>
                    <button onClick={() => sendMessage("Explain how Reentrancy attacks work")} className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded border border-slate-800 transition-colors">
                        📚 Explain Concept
                    </button>
                </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={clsx(
                "flex flex-col max-w-[85%]",
                msg.role === 'user' ? "self-end items-end" : "self-start items-start"
              )}
            >
              <div
                className={clsx(
                  "rounded-2xl p-3 text-sm relative group",
                  msg.role === 'user'
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700"
                )}
              >
                {msg.role === 'assistant' ? (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({node, inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeString = String(children).replace(/\n$/, '');
                                return !inline && match ? (
                                    <div className="relative my-2 rounded-lg overflow-hidden border border-slate-700">
                                        <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-700">
                                            <span className="text-xs text-slate-400 font-mono">{match[1]}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleCopy(codeString, idx)}
                                                    className="text-slate-400 hover:text-white"
                                                    title="Copy Code"
                                                >
                                                    {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                                                </button>
                                                {activeFile && (
                                                    <button
                                                        onClick={() => handleApply(codeString)}
                                                        className="text-slate-400 hover:text-blue-400 flex items-center gap-1 text-xs"
                                                        title="Apply to Editor"
                                                    >
                                                        <Terminal size={14} />
                                                        Apply
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <SyntaxHighlighter
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            {...props}
                                            customStyle={{ margin: 0, borderRadius: 0 }}
                                        >
                                            {codeString}
                                        </SyntaxHighlighter>
                                    </div>
                                ) : (
                                    <code className={clsx("bg-black/20 px-1 py-0.5 rounded font-mono text-xs", className)} {...props}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    >
                        {msg.content}
                    </ReactMarkdown>
                ) : (
                    <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="self-start flex items-center gap-2 text-slate-500 text-sm p-2">
               <Loader2 className="w-4 h-4 animate-spin" />
               Echo is thinking...
            </div>
          )}

          {error && (
             <div className="text-center text-red-400 text-xs p-2 bg-red-500/10 border border-red-500/20 rounded">
                {error}
             </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-800 rounded-b-2xl">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Echo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
