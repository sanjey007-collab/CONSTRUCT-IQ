"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Building2,
  DollarSign,
  ArrowRight,
  PackageCheck
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function SurplusPage() {
  const [surplusList, setSurplusList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchSurplus();
  }, []);

  const fetchSurplus = async () => {
    try {
      const data = await apiFetch<any[]>("/surplus");
      setSurplusList(data);
    } catch (e) {
      console.error("Failed to load surplus:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await apiFetch<any[]>("/surplus/scan", { method: "POST" });
      setSurplusList(res);
    } catch (e) {
      console.error("Surplus scan failed:", e);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="text-emerald-400" />
            Actionable Material Surplus Intelligence
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Detects excess materials held across active projects exceeding local scheduled requirements and safety buffers.
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E2638] hover:bg-[#28334A] text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all active:scale-95"
        >
          <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
          <span>{scanning ? "Scanning Yards..." : "Scan Excess Inventory"}</span>
        </button>
      </div>

      {/* Surplus Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Scanning project yards for actionable excess...</div>
      ) : surplusList.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#111726] border border-[#1E2638] text-center text-xs text-zinc-400">
          No excess inventory currently detected. All active materials are within planned consumption thresholds.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surplusList.map((sur) => (
            <div
              key={sur.id}
              className="p-5 rounded-xl bg-[#111726] border border-emerald-500/30 hover:border-emerald-500/50 transition-all space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between border-b border-[#1E2638] pb-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    VERIFIED SURPLUS
                  </span>
                  <h3 className="font-bold text-sm text-white mt-1.5">{sur.material_name}</h3>
                  <p className="text-xs text-zinc-400">Held at {sur.project_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-mono">Confidence: {(sur.confidence * 100).toFixed(0)}%</span>
                  <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    ₹{sur.value.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#141B2D] border border-[#1E2638]">
                  <span className="text-[10px] text-zinc-400">Available Surplus</span>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">
                    {sur.surplus_quantity.toLocaleString()} {sur.unit}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141B2D] border border-[#1E2638]">
                  <span className="text-[10px] text-zinc-400">Estimated Release Date</span>
                  <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                    {new Date(sur.expected_surplus_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Potential Recipients */}
              <div className="p-3 rounded-lg bg-[#0F1424] border border-[#1E2638] text-xs space-y-2">
                <span className="font-bold text-zinc-300 text-[11px] flex items-center gap-1.5">
                  <Building2 size={13} className="text-blue-400" />
                  Matched Candidate Recipients in Organization:
                </span>
                {sur.possible_destination_projects && sur.possible_destination_projects.length > 0 ? (
                  <div className="space-y-1 text-zinc-400">
                    {sur.possible_destination_projects.map((dest: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-300">• {dest.project_name}</span>
                        <span className="text-amber-400 font-mono">Needs {dest.needed_quantity} {sur.unit}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500">Ready for redistribution or central buffer.</p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Link
                  href="/optimization"
                  className="px-3.5 py-1.5 rounded-lg bg-[#1E2638] hover:bg-[#28334A] text-amber-400 hover:text-amber-300 font-semibold text-xs border border-zinc-700 transition-all flex items-center gap-1.5"
                >
                  <span>Optimize Redistribution</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
