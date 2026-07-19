"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm FoodMart AI. I can help you find restaurants, track orders, or suggest what to eat. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, history }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong. Please try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting. Please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: "Browse Restaurants", url: "/restaurants" },
    { label: "My Orders", url: "/orders" },
    { label: "Track Order", url: "/orders" },
  ];

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl transition-all duration-300 cursor-pointer flex items-center justify-center ${
          isOpen
            ? "bg-neutral-800 hover:bg-neutral-700 rotate-0"
            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-450 hover:scale-110 hover:shadow-amber-500/30"
        }`}
        aria-label={isOpen ? "Close chat" : "Open AI chat assistant"}
      >
        {isOpen ? (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Notification dot when closed */}
      {!isOpen && (
        <span className="fixed bottom-6 right-6 z-50 h-4 w-4 rounded-full bg-red-500 border-2 border-white pointer-events-none" />
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col" style={{ height: "520px" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-neutral-900" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">FoodMart AI</h3>
              <p className="text-neutral-400 text-[10px] font-medium">Always here to help</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-neutral-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-500 text-white rounded-br-md"
                      : "bg-white border border-neutral-200 text-neutral-800 rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-neutral-100 bg-white shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Quick Actions</p>
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action) => (
                  <a
                    key={action.label}
                    href={action.url}
                    className="rounded-full bg-neutral-100 hover:bg-amber-100 border border-neutral-200 hover:border-amber-300 px-3 py-1 text-xs font-semibold text-neutral-600 hover:text-amber-700 transition-all"
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-neutral-100 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about food..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-xl bg-amber-500 hover:bg-amber-400 flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
