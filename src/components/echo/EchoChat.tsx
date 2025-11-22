
import React, { useRef, useEffect } from 'react';
import { useEcho } from '../../store/useEcho';
import { echoService } from '../../services/echo';
import { useFileSystem } from '../../store/useFileSystem';
import { X, Send, User, Bot, Loader2, Copy, Play } from 'lucide-react';
import { clsx } from 'clsx';
// Simple markdown parser or just text for now. For robust markdown, we'd need a library.
// I'll implement a basic code block detector.

export function EchoChat() {
  const { isOpen, toggleOpen, messages, addMessage, isLoading, setLoading } = useEcho();
  const { activeFile, files, updateFileContent } = useFileSystem();

  const [input, setInput] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setLoading(true);

    try {
        // Get context from active file
        let codeContext = undefined;
        if (activeFile && files[activeFile]) {
            codeContext = `Current File (${activeFile}):\n${files[activeFile].content}`;
        }

        const response = await echoService.sendMessage(userMessage, codeContext);
        addMessage('assistant', response.message);
    } catch (error: any) {
        addMessage('assistant', `Error: ${error.message || 'Something went wrong.'}`);
    } finally {
        setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to render message content with basic code blocks
  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);

        return (
          <div key={index} className="my-2 rounded-md overflow-hidden border border-slate-700 bg-slate-950/50">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 text-xs text-slate-400">
                <span>{lang || 'code'}</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigator.clipboard.writeText(code)}
                        className="hover:text-white flex items-center gap-1"
                        title="Copy"
                    >
                        <Copy size={12} /> Copy
                    </button>
                    {activeFile && (
                        <button
                            onClick={() => updateFileContent(activeFile, code)}
                            className="hover:text-blue-400 flex items-center gap-1"
                            title="Apply to Editor"
                        >
                            <Play size={12} /> Apply
                        </button>
                    )}
                </div>
            </div>
            <pre className="p-3 text-xs overflow-x-auto font-mono text-slate-300 scrollbar-hide">
                {code}
            </pre>
          </div>
        );
      }
      return <p key={index} className="whitespace-pre-wrap mb-1">{part}</p>;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[450px] h-[600px] max-h-[80vh] flex flex-col glass-panel rounded-2xl shadow-2xl border border-slate-700/50 animate-in slide-in-from-bottom-10 fade-in duration-200">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Bot size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Echo AI</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <button
            onClick={toggleOpen}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
            <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
      >
        {messages.map((msg) => (
            <div
                key={msg.id}
                className={clsx(
                    "flex gap-3 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
            >
                <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    msg.role === 'user' ? "bg-slate-700" : "bg-blue-600/20"
                )}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={16} className="text-blue-400" />}
                </div>

                <div className={clsx(
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user'
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
                )}>
                    {renderContent(msg.content)}
                </div>
            </div>
        ))}

        {isLoading && (
            <div className="flex gap-3 mr-auto">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-blue-400" />
                </div>
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur rounded-b-2xl">
        <div className="relative">
            <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Echo to review code or explain concepts..."
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none h-12 max-h-32 scrollbar-hide"
            />
            <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-transparent disabled:text-slate-600"
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
        </div>
        <div className="mt-2 text-[10px] text-slate-500 text-center">
            Echo can make mistakes. Please verify generated code.
        </div>
      </div>
    </div>
  );
}
