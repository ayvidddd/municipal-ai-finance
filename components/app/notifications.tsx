"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Receipt, Mail, RefreshCw, Sparkles, Bell } from "lucide-react";

type Notif = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: number;
  created_at: string;
  link: string | null;
};

const ICON_MAP: Record<string, React.ReactNode> = {
  anomaly: <AlertTriangle className="w-3.5 h-3.5" />,
  sla: <RefreshCw className="w-3.5 h-3.5" />,
  overdue: <Receipt className="w-3.5 h-3.5" />,
  triage: <Mail className="w-3.5 h-3.5" />,
  system: <Sparkles className="w-3.5 h-3.5" />,
};

export function NotificationBell({ icon }: { icon: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notif[]>([]);
  const router = useRouter();

  async function load() {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      const json = await r.json();
      setItems(json.notifications || []);
    } catch {}
  }

  React.useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-notif-root]")) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((i) => !i.read).length;

  async function markRead(id: number) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div data-notif-root className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        {icon}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-danger text-white text-[10px] font-medium flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[360px] rounded-lg border border-border bg-surface shadow-xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium">Notifications</h3>
              {unread > 0 && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {unread} unread
                </span>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {items.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  <Bell className="w-5 h-5 mx-auto mb-2 text-subtle" />
                  No notifications
                </div>
              )}
              {items.map((n) => {
                const content = (
                  <div
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                      if (n.link) {
                        router.push(n.link);
                        setOpen(false);
                      }
                    }}
                    className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-muted-foreground">{ICON_MAP[n.type] ?? <Bell className="w-3.5 h-3.5" />}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-subtle mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
                return <div key={n.id}>{content}</div>;
              })}
            </div>
            <Link
              href="/tools/audit"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs text-primary hover:bg-surface-2 transition-colors border-t border-border"
            >
              View all activity
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
