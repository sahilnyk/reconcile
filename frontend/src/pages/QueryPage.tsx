import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { api, type LlmQueryResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle } from "lucide-react";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";

export function QueryPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [result, setResult] = useState<LlmQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (data: {
    message: string;
    files: { file: File }[];
    pastedContent: { file: File }[];
    model: string;
    isThinkingEnabled: boolean;
  }) => {
    if (!data.message.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = await getAccessTokenSilently();
      const res = await api.queryLlm(data.message, token);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col w-full bg-background text-foreground relative">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <AnimatedAIChat
          onSend={(message: string) => handleSendMessage({ message, files: [], pastedContent: [], model: 'gpt-4o', isThinkingEnabled: false })}
          disabled={loading}
          placeholder="Ask about your invoices..."
        />
      </div>

      <div className="w-full max-w-2xl mx-auto px-6 pb-8 space-y-4">
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

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={result.refused ? "border-yellow-500/50" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    {result.refused ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-medium">
                      {result.refused ? "Out of scope" : "Answer"}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
                  {result.source_ids.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Source invoices:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.source_ids.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                          >
                            {id.slice(0, 8)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
