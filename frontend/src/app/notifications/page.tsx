"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch<any[]>("/notifications");
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      fetchNotifications();
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="text-amber-400" />
            Operational Alerts & Notifications
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {notifications.length} Alerts
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time critical shortage warnings, surplus match detections, and agent approval notices.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading notifications feed...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#111726] border border-[#1E2638] text-center text-xs text-zinc-400">
          No new notifications.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 text-xs ${
                n.is_read
                  ? "bg-[#111726] border-[#1E2638] opacity-75"
                  : "bg-[#141B2D] border-amber-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {n.severity === "CRITICAL" ? (
                    <AlertTriangle size={18} className="text-red-400" />
                  ) : n.severity === "HIGH" ? (
                    <Bell size={18} className="text-amber-400" />
                  ) : (
                    <Info size={18} className="text-blue-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{n.title}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-zinc-300 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.link && (
                  <Link
                    href={n.link}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 transition-all flex items-center gap-1"
                  >
                    <span>View</span>
                    <ArrowRight size={12} />
                  </Link>
                )}
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs"
                    title="Mark as read"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
