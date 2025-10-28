'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, ExternalLink, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StreamingText } from './streaming-text';

interface ProductCard {
  id: number;
  name: string;
  code: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  collection?: string;
  category?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  products?: ProductCard[];
  isStreaming?: boolean;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const dataRef = useRef<{ products?: ProductCard[] } | null>(null);

  const ProductThumb = ({ product }: { product: ProductCard }) => {
    const [loaded, setLoaded] = useState(false);

    return (
      <a
        href={product.productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-[rgb(164,120,100)] dark:hover:border-[rgb(184,140,120)] hover:shadow-lg transition-all duration-200"
        style={{ visibility: loaded ? 'visible' : 'hidden' }}
      >
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
          {/* Skeleton placeholder shown until image loads to avoid layout shift */}
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-gray-100 dark:bg-gray-800" />
          )}
          <img
            src={product.imageUrl}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              loaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
              setLoaded(true);
            }}
          />
        </div>
        <div className="p-2">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
            {product.name}
          </p>
          {product.code && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              {product.code}
            </p>
          )}
        </div>
      </a>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setShowWelcome(false);

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Add loading placeholder for assistant
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '', 
      isStreaming: true 
    }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      dataRef.current = data;
      
      // Debug log
      console.log('API Response:', {
        hasMessage: !!data.message,
        hasSources: !!data.sources,
        hasProducts: !!data.products,
        productsCount: data.products?.length || 0,
        cached: data.cached || false
      });

      // Update message with streaming enabled
      setIsTyping(true);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: data.message,
          sources: data.sources,
          // Delay product thumbnails until streaming completes
          products: [],
          isStreaming: true, // Will trigger StreamingText component
        };
        return newMessages;
      });

      // Completion handled by StreamingText onComplete
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Remove loading message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedQuestions = [
    "Show me your plate collections",
    "What's new at RAK Porcelain?",
    "How do I care for porcelain?",
    "Tell me about B2B options"
  ];

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#1f1f1f]">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-6 md:px-8 py-4 bg-white/80 dark:bg-[#1f1f1f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(164,120,100)] to-[rgb(144,100,80)] flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1f1f1f]"></div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                RAK Porcelain Assistant
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Always here to help
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
          {/* Welcome Screen */}
          {showWelcome && messages.length === 0 && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="text-center space-y-4 py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[rgb(164,120,100)] to-[rgb(144,100,80)] shadow-2xl mb-4">
                  <Sparkles className="w-10 h-10 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  Hi! I'm here to help you explore RAK Porcelain
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  Looking for the perfect porcelain pieces? I'd love to show you our collections, answer questions, or help you find exactly what you need.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="group p-4 text-left rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-[rgb(164,120,100)] dark:hover:border-[rgb(184,140,120)] hover:bg-[rgba(164,120,100,0.05)] dark:hover:bg-[rgba(184,140,120,0.1)] transition-all duration-200 hover:shadow-md"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[rgb(144,100,80)] dark:group-hover:text-[rgb(184,140,120)] leading-relaxed">
                      {question}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-8">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(164,120,100)] to-[rgb(144,100,80)] flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                )}

                <div className={cn(
                  "flex-1 max-w-[85%] md:max-w-[75%] space-y-3",
                  message.role === 'user' && 'flex justify-end'
                )}>
                  {message.role === 'user' ? (
                    <div className="inline-block px-6 py-4 rounded-full bg-[rgb(164,120,100)] text-white shadow-lg">
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Assistant text with typewriter effect */}
                      <div className="space-y-4">
                        <div className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200">
                          <StreamingText
                            text={message.content}
                            speed={30}
                            isStreaming={!!message.isStreaming}
                            className="text-[15px] leading-relaxed"
                            onComplete={() => {
                              setIsTyping(false);
                              setMessages(prev => {
                                const newMessages = [...prev];
                                if (newMessages.length > 0) {
                                  newMessages[newMessages.length - 1] = {
                                    ...newMessages[newMessages.length - 1],
                                    isStreaming: false,
                                    // Reveal products after streaming completes
                                    products: (newMessages[newMessages.length - 1].products && newMessages[newMessages.length - 1].products!.length > 0)
                                      ? newMessages[newMessages.length - 1].products
                                      : (dataRef.current?.products || []),
                                  };
                                }
                                return newMessages;
                              });
                            }}
                          />
                        </div>
                        {message.isStreaming && (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-[rgb(164,120,100)] dark:bg-[rgb(184,140,120)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-[rgb(164,120,100)] dark:bg-[rgb(184,140,120)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-[rgb(164,120,100)] dark:bg-[rgb(184,140,120)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Product Thumbnails - Show even while typing */}
                      {message.products && message.products.length > 0 && (
                        <div className="pt-4 mt-4 space-y-3 animate-in fade-in duration-500">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Featured Products ({message.products.length})
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {message.products.map((product, idx) => (
                              <ProductThumb key={idx} product={product} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                            Sources
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-[rgba(164,120,100,0.1)] dark:bg-[rgba(184,140,120,0.15)] text-[rgb(144,100,80)] dark:text-[rgb(184,140,120)] hover:bg-[rgba(164,120,100,0.2)] dark:hover:bg-[rgba(184,140,120,0.25)] transition-colors group"
                              >
                                <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                <span className="max-w-[200px] truncate">
                                  {new URL(source).pathname.split('/').pop() || 'Source'}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg">
                      <User className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex justify-center mt-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#1f1f1f]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end gap-3 p-2 rounded-full border border-gray-200 dark:border-gray-700 focus-within:border-[rgb(164,120,100)] dark:focus-within:border-[rgb(184,140,120)] bg-white dark:bg-[#2a2a2a] transition-all shadow-lg shadow-gray-200/50 dark:shadow-black/50">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about RAK Porcelain..."
                className="flex-1 resize-none bg-transparent px-6 py-3 text-[15px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none border-0 leading-relaxed"
                rows={1}
                disabled={isLoading}
                style={{
                  minHeight: '24px',
                  maxHeight: '200px',
                  outline: 'none',
                  boxShadow: 'none',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '24px';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={cn(
                  "flex-shrink-0 p-3 rounded-full transition-all duration-200",
                  isLoading || !input.trim()
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-[rgb(164,120,100)] hover:bg-[rgb(144,100,80)] text-white shadow-lg shadow-[rgba(164,120,100,0.3)] hover:shadow-xl hover:shadow-[rgba(164,120,100,0.4)] hover:scale-105"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>

          <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-4 leading-relaxed">
            RAK Porcelain AI Assistant can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
