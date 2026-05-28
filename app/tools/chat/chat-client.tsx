"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Send, Sparkles, Trash2, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Session = { id: number; title: string; started_at: string; last_message_at: string };
type Msg = { role: "user" | "assistant"; content: string; toolCalls?: { name: string }[] };

const PROMPTS = [
  "List all overdue DC accounts and their balances",
  "Calculate DC for a 24-unit mid-rise project",
  "Show me the latest reconciliation breaks",
  "What anomalies were flagged this month?",
];

export function ChatClient() {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [active, setActive] = React.useState<number | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  async function loadSessions() {
    const r = await fetch("/api/chat/sessions");
    const j = await r.json();
    setSessions(j.sessions);
    return j.sessions as Session[];
  }

  React.useEffect(() => {
    loadSessions().then((s) => {
      if (s.length === 0) {
        newChat();
      } else {
        openSession(s[0].id);
      }
    });
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function openSession(id: number) {
    setActive(id);
    const r = await fetch(`/api/chat/sessions/${id}`);
    const j = await r.json();
    setMessages(j.messages || []);
  }

  async function newChat() {
    const r = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", title: "New conversation" }),
    });
    const j = await r.json();
    await loadSessions();
    setActive(j.id);
    setMessages([]);
  }

  async function deleteChat(id: number) {
    await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    toast.success("Conversation deleted");
    const s = await loadSessions();
    if (active === id) {
      if (s.length > 0) openSession(s[0].id);
      else newChat();
    }
  }

  async function renameIfDefault(text: string) {
    if (!active) return;
    const current = sessions.find((s) => s.id === active);
    if (!current || current.title !== "New conversation") return;
    const title = text.slice(0, 60);
    await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", id: active, title }),
    });
    loadSessions();
  }

  async function send(text: string) {
    if (!text.trim() || streaming || !active) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    renameIfDefault(text);

    const assistantMsg: Msg = { role: "assistant", content: "", toolCalls: [] };
    setMessages([...next, assistantMsg]);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: active,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!r.ok || !r.body) throw new Error("stream failed");
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let textAcc = "";
      const toolCalls: { name: string }[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as { type: string; [k: string]: unknown };
            if (ev.type === "text_delta") {
              textAcc += ev.delta as string;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { ...copy[copy.length - 1], content: textAcc, toolCalls: [...toolCalls] };
                return copy;
              });
            } else if (ev.type === "tool_start") {
              toolCalls.push({ name: ev.name as string });
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { ...copy[copy.length - 1], toolCalls: [...toolCalls] };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      toast.error("Chat request failed");
      console.error(e);
    } finally {
      setStreaming(false);
      loadSessions();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="p-3">
          <Button onClick={newChat} className="w-full" size="sm">
            <Plus className="w-3.5 h-3.5" />
            New conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                active === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              )}
              onClick={() => openSession(s.id)}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{s.title}</div>
                <div className="text-[10px] text-subtle">
                  {formatDistanceToNow(new Date(s.last_message_at.replace(" ", "T") + "Z"), { addSuffix: true })}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(s.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-subtle hover:text-danger"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !streaming && (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">MuniBot</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  Ask about forecasts, DC/CIL accounts, or reconciliation breaks.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                  {PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="text-left text-sm px-3 py-2.5 rounded-md border border-border hover:bg-surface-2 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3"
              >
                <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white"
                  style={{
                    background: m.role === "user" ? "var(--muted-foreground)" : "linear-gradient(to bottom right, var(--primary), var(--info))",
                  }}
                >
                  {m.role === "user" ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium mb-1 text-muted-foreground">
                    {m.role === "user" ? "You" : "MuniBot"}
                  </div>
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {m.toolCalls.map((t, j) => (
                        <Badge key={j} variant="primary" className="font-mono">
                          <Wrench className="w-2.5 h-2.5" />
                          {t.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="my-2">{children}</p>,
                        code: ({ children }) => (
                          <code className="px-1 py-0.5 rounded bg-surface-2 text-xs font-mono">{children}</code>
                        ),
                        pre: ({ children }) => (
                          <pre className="rounded-md bg-surface-2 p-3 text-xs font-mono overflow-x-auto">
                            {children}
                          </pre>
                        ),
                        ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 my-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1 my-2">{children}</ol>,
                        a: ({ href, children }) => (
                          <a href={href} className="text-primary underline">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {m.content || (streaming && i === messages.length - 1 ? "..." : "")}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="border-t border-border bg-surface px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={streaming || !active}
                placeholder="Ask MuniBot anything..."
                rows={1}
                className="w-full resize-none rounded-md border border-border bg-input p-3 pr-12 text-sm placeholder:text-subtle focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors min-h-[44px] max-h-[200px]"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                className="absolute right-2 bottom-2 h-7 w-7 inline-flex items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-30 transition-colors"
                aria-label="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-subtle mt-2 text-center">
              MuniBot has live database access. Responses are powered by Claude Sonnet 4.5.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
