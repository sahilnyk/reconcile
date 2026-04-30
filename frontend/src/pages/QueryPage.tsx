import { useState, useRef, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { api, type LlmQueryResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle, User, Bot } from "lucide-react";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";

// Dev bypass token - used when Auth0 is not configured
const DEV_TOKEN = "dev-bypass-token";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  refused?: boolean;
  sourceIds?: string[];
}

export function QueryPage() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getToken = async (): Promise<string> => {
    if (isAuthenticated) {
      return await getAccessTokenSilently();
    }
    // Return dev token for bypass mode
    return DEV_TOKEN;
  };

  const handleSendMessage = async (data: {
    message: string;
    files: { file: File }[];
    pastedContent: { file: File }[];
    model: string;
    isThinkingEnabled: boolean;
  }) => {
    if (!data.message.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: data.message,
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await api.queryLlm(data.message, token);

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer,
        refused: res.refused,
        sourceIds: res.source_ids,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col w-full bg-background text-foreground relative">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Ask me about your invoices</p>
              <p className="text-sm mt-2">Try: "What are my expenses this month?" or "How many vendors do I have?"</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}>
                  <Card className={msg.refused ? "border-yellow-500/50" : msg.role === "assistant" ? "bg-secondary/50" : ""}>
                    <CardContent className="p-4">
                      {msg.role === "assistant" && msg.refused && (
                        <div className="flex items-center gap-2 mb-2 text-yellow-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs font-medium">Out of scope</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-left">{msg.content}</p>

                      {msg.sourceIds && msg.sourceIds.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Source invoices:</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.sourceIds.map((id: string) => (
                              <span
                                key={id}
                                className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
                              >
                                {id.slice(0, 8)}...
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <Card className="bg-secondary/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
              >
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="w-full max-w-2xl mx-auto">
          <AnimatedAIChat
            onSend={(message: string) => handleSendMessage({ message, files: [], pastedContent: [], model: 'gpt-4o', isThinkingEnabled: false })}
            disabled={loading}
            placeholder="Ask about your invoices..."
          />
        </div>
      </div>
    </div>
  );
}
