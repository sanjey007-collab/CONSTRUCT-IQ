"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ForecastPage() {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [selectedHorizon, setSelectedHorizon] = useState<"7d" | "14d" | "30d" | "60d">("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecasts();
  }, []);

  const fetchForecasts = async () => {
    try {
      const data = await apiFetch<any[]>("/forecast");
      setForecasts(data);
    } catch (e) {
      console.error("Failed to load forecasts:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <TrendingUp className="text-blue-400" />
            Deterministic Material Forecasting Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Deterministic consumption forecasting across 7-day, 14-day, 30-day, and 60-day project activity windows.
          </p>
        </div>

        {/* Horizon Toggle */}
        <div className="flex gap-1.5 p-1 rounded-lg bg-[#111726] border border-[#1E2638]">
          {(["7d", "14d", "30d", "60d"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedHorizon === h
                  ? "bg-blue-600 text-white shadow-md font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {h.toUpperCase()} Horizon
            </button>
          ))}
        </div>
      </div>

      {/* Formula Explanation Card */}
      <div className="p-4 rounded-xl bg-[#111726] border border-[#1E2638] text-xs text-zinc-300 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[#141B2D] border border-zinc-800">
          <span className="font-mono text-blue-400 font-bold text-[11px]">PROJECTED INVENTORY</span>
          <p className="text-[11px] text-zinc-400 mt-1">
            Current Available + Incoming &minus; Forecasted Consumption
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#141B2D] border border-zinc-800">
          <span className="font-mono text-red-400 font-bold text-[11px]">PROJECTED SHORTAGE</span>
          <p className="text-[11px] text-zinc-400 mt-1">
            Required Milestone Demand &minus; Projected Inventory
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#141B2D] border border-zinc-800">
          <span className="font-mono text-emerald-400 font-bold text-[11px]">EXCESS / SURPLUS</span>
          <p className="text-[11px] text-zinc-400 mt-1">
            Projected Inventory &minus; (Future Required + Safety Stock)
          </p>
        </div>
      </div>

      {/* Forecast Matrix Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Computing deterministic multi-horizon forecasts...</div>
      ) : (
        <div className="rounded-xl bg-[#111726] border border-[#1E2638] overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0E1320] border-b border-[#1E2638] text-zinc-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Material & Project</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Daily Burn Rate</th>
                <th className="py-3 px-4">Projected Consumption ({selectedHorizon})</th>
                <th className="py-3 px-4">Projected Stock ({selectedHorizon})</th>
                <th className="py-3 px-4">Shortage Risk</th>
                <th className="py-3 px-4">Potential Surplus</th>
                <th className="py-3 px-4">Action Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638] text-zinc-300">
              {forecasts.map((fc) => {
                const item = fc.forecasts[selectedHorizon];
                if (!item) return null;

                return (
                  <tr key={`${fc.project_id}-${fc.material_id}`} className="hover:bg-[#141B2D] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{fc.material_name}</p>
                      <p className="text-[10px] text-zinc-500">{fc.project_name}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {fc.current_inventory.toLocaleString()} {fc.unit}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {fc.daily_consumption_rate.toLocaleString()} {fc.unit}/day
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-300">
                      {item.projected_consumption.toLocaleString()} {fc.unit}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {item.projected_inventory.toLocaleString()} {fc.unit}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {item.projected_shortage > 0 ? (
                        <span className="font-bold text-red-400 bg-red-950/20 px-2 py-0.5 rounded border border-red-500/30">
                          {item.projected_shortage.toLocaleString()} {fc.unit}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {item.excess_inventory > 0 ? (
                        <span className="font-bold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/30">
                          +{item.excess_inventory.toLocaleString()} {fc.unit}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "SHORTAGE_RISK" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Shortage Risk
                        </span>
                      ) : item.status === "POTENTIAL_SURPLUS" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Surplus
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                          Balanced
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
