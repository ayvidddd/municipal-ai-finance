"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Mail, Plus, RefreshCw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type Email = {
  id: number;
  sender: string;
  subject: string;
  body: string;
  received_at: string;
  priority: string;
  category: string;
  suggested_action: string | null;
  draft_response: string | null;
  status: string;
};

function priorityVariant(p: string) {
  if (p === "urgent") return "danger" as const;
  if (p === "high") return "warning" as const;
  if (p === "medium") return "primary" as const;
  return "outline" as const;
}

export function EmailTriageClient() {
  const [emails, setEmails] = React.useState<Email[]>([]);
  const [kpis, setKpis] = React.useState<{ unread: number; urgent: number } | null>(null);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [draft, setDraft] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [reclassifying, setReclassifying] = React.useState(false);

  async function load() {
    const r = await fetch("/api/emails", { cache: "no-store" });
    const j = await r.json();
    setEmails(j.emails);
    setKpis(j.kpis);
    setLoading(false);
    if (selectedId == null && j.emails.length > 0) {
      setSelectedId(j.emails[0].id);
      setDraft(j.emails[0].draft_response || "");
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const selected = emails.find((e) => e.id === selectedId);

  React.useEffect(() => {
    if (selected) {
      setDraft(selected.draft_response || "");
      if (selected.status === "unread") {
        fetch("/api/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mark_read", id: selected.id }),
        }).then(load);
      }
    }
  }, [selectedId]);

  async function triageOne() {
    if (!selected) return;
    toast.message("Reclassifying with Claude...");
    await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "triage_one", id: selected.id }),
    });
    toast.success("Reclassified");
    load();
  }

  async function reclassifyAll() {
    setReclassifying(true);
    toast.message("Reclassifying inbox...");
    const r = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reclassify_all" }),
    });
    const j = await r.json();
    setReclassifying(false);
    toast.success(`Reclassified ${j.count} emails`);
    load();
  }

  async function newEmail() {
    toast.message("New email incoming...");
    const r = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "new_simulated" }),
    });
    const j = await r.json();
    toast.success("New email triaged");
    await load();
    setSelectedId(j.id);
  }

  async function sendResponse() {
    if (!selected) return;
    await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_draft", id: selected.id, draft }),
    });
    await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", id: selected.id }),
    });
    toast.success("Response sent (simulated)");
    load();
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-[360px] shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="flex-1">
            <h2 className="text-sm font-medium">Inbox</h2>
            <p className="text-[10px] text-muted-foreground">
              {kpis ? `${kpis.unread} unread • ${kpis.urgent} urgent` : "Loading..."}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={newEmail} title="Simulate new email">
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={reclassifyAll} disabled={reclassifying} title="Reclassify all">
            <RefreshCw className={cn("w-3.5 h-3.5", reclassifying && "animate-spin")} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-3 space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          )}
          {emails.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedId(e.id)}
              className={cn(
                "w-full text-left p-3 border-b border-border hover:bg-surface-2 transition-colors",
                selectedId === e.id && "bg-surface-2",
                e.status === "unread" && "border-l-2 border-l-primary"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={priorityVariant(e.priority)}>{e.priority}</Badge>
                <span className="text-[10px] text-subtle ml-auto">
                  {formatDistanceToNow(new Date(e.received_at.replace(" ", "T") + "Z"), { addSuffix: true })}
                </span>
              </div>
              <div className="text-xs font-medium truncate">{e.sender}</div>
              <div className="text-sm font-medium truncate mt-0.5">{e.subject}</div>
              <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{e.body}</div>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {!selected && (
          <EmptyState
            icon={<Mail className="w-5 h-5" />}
            title="No email selected"
            description="Choose an email from the inbox."
            className="m-6"
          />
        )}
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <header className="px-6 py-4 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold tracking-tight">{selected.subject}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    From <span className="text-foreground">{selected.sender}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={priorityVariant(selected.priority)}>{selected.priority}</Badge>
                  <Badge variant="outline">{selected.category}</Badge>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="rounded-md border border-border bg-surface p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.body}</p>
              </div>

              <div className="rounded-md border border-border bg-surface-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    AI analysis
                  </h3>
                  <Button variant="ghost" size="sm" onClick={triageOne}>
                    <RefreshCw className="w-3 h-3" />
                    Re-analyze
                  </Button>
                </div>
                {selected.suggested_action && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-subtle">Suggested action</div>
                    <p className="text-sm mt-1">{selected.suggested_action}</p>
                  </div>
                )}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-subtle">Draft response</div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={8}
                    className="w-full mt-1 rounded-md border border-border bg-input p-3 text-sm font-sans leading-relaxed focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Run AI analysis to generate a draft..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(draft);
                      toast.success("Copied");
                    }}
                  >
                    Copy
                  </Button>
                  <Button size="sm" onClick={sendResponse} disabled={!draft.trim()}>
                    <Send className="w-3 h-3" />
                    Send response
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
