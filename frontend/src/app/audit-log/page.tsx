"use client";

import { useEffect, useState } from "react";
import {
  History,
  Shield,
  Search,
  Filter,
  User,
  Clock,
  Laptop
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await apiFetch<any[]>("/audit-log");
      setLogs(data);
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((l) => {
    return (
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="text-amber-400" />
            Enterprise Security & Compliance Audit Log
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              Immutable Trail
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete record of human user actions, agent autonomous triggers, inventory mutations, and policy decisions.
          </p>
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter by action, user, or entity..."
        className="px-4 py-2 text-xs rounded-lg bg-[#141B2D] border border-[#1E2638] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 w-full sm:w-80"
      />

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading audit trail...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#111726] border border-[#1E2638] text-center text-xs text-zinc-400">
          No audit logs recorded matching query.
        </div>
      ) : (
        <div className="rounded-xl bg-[#111726] border border-[#1E2638] overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0E1320] border-b border-[#1E2638] text-zinc-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Context Payload</th>
                <th className="py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638] text-zinc-300">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-[#141B2D] transition-colors">
                  <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    {log.user_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] text-amber-300 font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                    {log.entity}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-zinc-400 max-w-xs truncate">
                    {log.new_value ? JSON.stringify(log.new_value) : "-"}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-500 text-[10px]">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
