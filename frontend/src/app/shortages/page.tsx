"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Calendar,
  DollarSign
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ShortagesPage() {
  const [shortages, setShortages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  useEffect(() => {
    fetchShortages();
  }, []);

  const fetchShortages = async () => {
    try {
      const data = await apiFetch<any[]>("/shortages");
      setShortages(data);
    } catch (e) {
      console.error("Failed to fetch shortages:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await apiFetch<any[]>("/shortages/scan", { method: "POST" });
      setShortages(res);
    } catch (e) {
      console.error("Scan failed:", e);
    } finally {
      setScanning(false);
    }
  };

  const filtered = shortages.filter((s) => {
    if (filterSeverity === "ALL") return true;
    return s.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <AlertTriangle className="text-red-400" />
            Predicted Material Shortage Radar
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Early warning radar identifying material shortfalls against scheduled construction milestones before site stoppages occur.
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E2638] hover:bg-[#28334A] text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all active:scale-95"
        >
          <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
          <span>{scanning ? "Scanning Schedules..." : "Scan Shortage Radar"}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterSeverity === sev
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : "bg-[#111726] text-zinc-400 border border-[#1E2638] hover:text-white"
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Shortages Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading shortage telemetry...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#111726] border border-[#1E2638] text-center text-xs text-zinc-400">
          No open material shortages found for selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-xl bg-[#111726] border border-red-500/40 hover:border-red-500/60 transition-all space-y-4 shadow-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#1E2638] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                    {s.severity} SEVERITY
                  </span>
                  <h3 className="font-bold text-sm text-white">{s.material_name}</h3>
                  <span className="text-xs text-zinc-400 font-medium">@ {s.project_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                    <Clock size={13} className="text-amber-400" />
                    Shortage in <strong>{s.days_until_shortage} days</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#141B2D] border border-[#1E2638]">
                  <span className="text-[10px] text-zinc-400">Required Quantity</span>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">
                    {s.required_quantity.toLocaleString()} {s.unit}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141B2D] border border-[#1E2638]">
                  <span className="text-[10px] text-zinc-400">Available / Incoming</span>
                  <p className="text-sm font-bold text-zinc-400 font-mono mt-0.5">
                    {s.available_quantity.toLocaleString()} {s.unit}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141B2D] border border-red-500/30 bg-red-950/10">
                  <span className="text-[10px] text-red-400">Deficit Gap</span>
                  <p className="text-sm font-bold text-red-400 font-mono mt-0.5">
                    {s.shortage_quantity.toLocaleString()} {s.unit}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141B2D] border border-[#1E2638]">
                  <span className="text-[10px] text-zinc-400">Financial Exposure</span>
                  <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                    ₹{s.estimated_financial_impact.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0F1424] border border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-red-400 text-[11px] uppercase">Schedule Stoppage Risk:</span>
                  <p className="text-zinc-300">{s.schedule_risk}</p>
                </div>

                <Link
                  href="/optimization"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md"
                >
                  <Sparkles size={14} />
                  <span>Resolve with AI Matching Engine</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
