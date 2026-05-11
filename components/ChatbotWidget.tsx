"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

const SUGGESTED_PROMPTS = [
  "When is my next DC payment due?",
  "How is parkland CIL calculated?",
  "What if I miss a payment?",
  "How do by law updates affect my development?",
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "intro",
    role: "assistant",
    content:
      "Hello, I am the municipal DC and CIL assistant. I can answer questions about Development Charges, parkland Cash in Lieu payments, payment schedules, and recent by law updates. How can I help today?",
  },
];

export function ChatbotWidget() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "I was not able to generate a reply.",
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I could not reach the AI service. The chatbot needs an Anthropic API key set in the ANTHROPIC_API_KEY environment variable. Once that is configured the assistant will respond live.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages(INITIAL_MESSAGES);
    setError(null);
    setInput("");
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-navy text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold-light">
              <Sparkles className="h-3.5 w-3.5" />
              Live assistant
            </div>
            <CardTitle className="mt-1 text-white">DC and CIL Assistant</CardTitle>
            <CardDescription className="text-slate-200">
              Trained on Development Charges, parkland Cash in Lieu, payment schedules, and by law updates.
            </CardDescription>
          </div>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md border border-white/20 px-2.5 py-1 text-xs text-white/80 hover:bg-white/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className="flex max-h-[460px] min-h-[300px] flex-col gap-3 overflow-y-auto p-5 scrollbar-thin"
        >
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "assistant" && (
                  <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-navy text-gold">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-navy text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gold text-navy">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-gold">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm">
                <span className="inline-flex gap-1">
                  <Dot delay={0} />
                  <Dot delay={0.15} />
                  <Dot delay={0.3} />
                </span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="border-t border-border bg-muted/30 px-5 py-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Try asking
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                disabled={loading}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-slate-warm hover:border-navy hover:text-navy disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border p-4"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a DC payment, CIL calculation, or by law update..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" variant="default" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </form>

        {error && (
          <div className="px-4 pb-3 text-xs text-amber-700">
            Note: {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block h-1.5 w-1.5 rounded-full bg-slate-warm"
      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 0.9, repeat: Infinity, delay }}
    />
  );
}
