import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Send, X, Sparkles, Loader2, Trash2, Minus, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";

import ChatbotGeneratedImage from "@/components/ChatbotGeneratedImage";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/car-recommendation-chat`;

const QUICK_PROMPTS = [
  "Best cars under ₹10 Lakh?",
  "Compare SUVs vs Sedans",
  "Most fuel-efficient cars?",
  "Best electric cars available?",
];

const allowImageDataUrl = (url: string) =>
  url.startsWith("data:image/") ? url : defaultUrlTransform(url);

const CHAT_UI_STATE_KEY = "carbazaar_chatbot_ui_state";

const AICarChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return JSON.parse(localStorage.getItem(CHAT_UI_STATE_KEY) || "{}").isMinimized ?? false; } catch { return false; }
  });
  const [isMaximized, setIsMaximized] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return JSON.parse(localStorage.getItem(CHAT_UI_STATE_KEY) || "{}").isMaximized ?? false; } catch { return false; }
  });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_UI_STATE_KEY, JSON.stringify({ isMinimized, isMaximized }));
    } catch {}
  }, [isMinimized, isMaximized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const streamChat = async (allMessages: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || `Error ${resp.status}`);
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          // partial JSON, wait for more
        }
      }
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      await streamChat([...messages, userMsg]);
    } catch (e: any) {
      const msg = e?.message || "Failed to get response. Please check your connection and try again.";
      setError(msg);
      toast({
        title: "Chatbot Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (lastUser) send(lastUser.content);
  };


  return (
    <>
      {/* AI Chat Toggle - positioned above the LiveChat button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-24 right-6 h-12 w-12 rounded-full shadow-lg z-50 gradient-gold border-0",
          isOpen && "bg-destructive hover:bg-destructive/90"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <Card
          className={cn(
            "fixed shadow-2xl z-50 flex flex-col border-primary/20 transition-all duration-300",
            isMaximized
              ? "bottom-4 right-4 left-4 top-4 sm:bottom-6 sm:right-6 sm:left-auto sm:top-6 sm:w-[600px] sm:h-[calc(100vh-3rem)]"
              : isMinimized
              ? "bottom-40 right-6 w-[280px] h-12"
              : "bottom-40 right-6 w-[400px] h-[520px]"
          )}
        >
          <CardHeader className="py-2 px-4 border-b gradient-card flex flex-row items-center gap-2 shrink-0">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-sm flex-1 truncate">CARBAZAAR AI Assistant</CardTitle>
            {!isMinimized && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMessages([])} aria-label="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setIsMinimized(!isMinimized); if (isMaximized) setIsMaximized(false); }}
              aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => { setIsMaximized(!isMaximized); if (isMinimized) setIsMinimized(false); }}
              aria-label={isMaximized ? "Restore chat" : "Maximize chat"}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {!isMinimized && (
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">

            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="space-y-4 pt-4">
                  <div className="text-center">
                    <Bot className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-foreground">Hi! I'm your AI Car Expert 🚗</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ask me anything about cars — budget picks, comparisons, or recommendations!
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => send(prompt)}
                        className="text-xs p-2.5 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 text-left transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                            <ReactMarkdown
                              urlTransform={allowImageDataUrl}
                              components={{
                                img: ChatbotGeneratedImage,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                placeholder="Ask about cars..."
                disabled={isLoading}
                className="text-sm"
              />
              <Button
                size="icon"
                onClick={() => send(input)}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          )}
        </Card>
      )}
    </>
  );
};

export default AICarChatbot;
