"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitCompare,
  Truck,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Info
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function OptimizationPage() {
  const [shortages, setShortages] = useState<any[]>([]);
  const [selectedShortage, setSelectedShortage] = useState<any | null>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const data = await apiFetch<any[]>("/shortages");
      setShortages(data);
      if (data.length > 0) {
        loadComparison(data[0]);
      }
    } catch (e) {
      console.error("Failed to load shortages:", e);
    }
  };

  const loadComparison = async (shortage: any) => {
    setSelectedShortage(shortage);
    setLoadingOptions(true);
    try {
      const res = await apiFetch<any>(`/optimization/compare/${shortage.id}`);
      setOptions(res.options || []);
    } catch (e) {
      console.error("Failed to load comparison options:", e);
    } finally {
      setLoadingOptions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <GitCompare className="text-amber-400" />
            Cross-Project Resource Optimization Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Dynamic algorithm comparing inter-site surplus redistribution against commercial supplier procurement and split alternatives.
          </p>
        </div>

        {selectedShortage && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md"
          >
            <GitCompare size={15} />
            <span>Open Side-by-Side Comparison Matrix</span>
          </button>
        )}
      </div>

      {/* Target Shortage Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {shortages.map((s) => (
          <button
            key={s.id}
            onClick={() => loadComparison(s)}
            className={`px-4 py-2.5 rounded-lg text-xs font-medium border transition-all shrink-0 text-left ${
              selectedShortage?.id === s.id
                ? "bg-[#1E2738] text-amber-400 border-amber-500/50 font-bold"
                : "bg-[#111726] text-zinc-400 border-[#1E2638] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>{s.project_name}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {s.shortage_quantity.toLocaleString()} {s.unit} {s.material_name}
            </p>
          </button>
        ))}
      </div>

      {/* Selected Imbalance Summary Banner */}
      {selectedShortage && (
        <div className="p-4 rounded-xl bg-[#141B2D] border border-[#1E2638] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{selectedShortage.material_name}</span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold text-[10px]">
                {selectedShortage.severity} SEVERITY
              </span>
            </div>
            <p className="text-zinc-300">
              Target Site: <strong className="text-white">{selectedShortage.project_name}</strong> | Required Quantity:{" "}
              <strong className="text-amber-400">{selectedShortage.shortage_quantity.toLocaleString()} {selectedShortage.unit}</strong> | Deadline:{" "}
              <strong>{selectedShortage.days_until_shortage} days</strong> ({new Date(selectedShortage.required_by_date).toLocaleDateString()})
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-zinc-400">Risk Assessment:</span>
            <p className="text-red-400 font-semibold">{selectedShortage.schedule_risk}</p>
          </div>
        </div>
      )}

      {/* Dynamic Options Grid */}
      {loadingOptions ? (
        <div className="p-12 text-center text-xs text-zinc-400">Evaluating multi-project options and freight rates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {options.map((opt) => (
            <div
              key={opt.id}
              className={`p-6 rounded-xl border transition-all space-y-4 relative ${
                opt.is_recommended
                  ? "bg-[#13192B] border-amber-500/50 shadow-xl shadow-amber-500/5"
                  : "bg-[#111726] border-[#1E2638]"
              }`}
            >
              {opt.is_recommended && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500 text-black font-bold text-[11px]">
                  <Sparkles size={13} />
                  <span>RECOMMENDED OPTION (RANK #{opt.ranking})</span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  {opt.option_type === "TRANSFER" ? (
                    <Truck size={18} className="text-amber-400" />
                  ) : (
                    <ShoppingCart size={18} className="text-blue-400" />
                  )}
                  <span className="text-xs font-mono uppercase text-zinc-400">
                    Option Type: {opt.option_type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{opt.title}</h3>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{opt.description}</p>
              </div>

              {/* Economics Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#0F1422] border border-[#1E2638]">
                  <span className="text-[10px] text-zinc-400">Out-of-Pocket Cost</span>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">
                    ₹{opt.total_cost.toLocaleString()}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0F1422] border border-[#1E2638]">
                  <span className="text-[10px] text-zinc-400">Net Estimated Savings</span>
                  <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    {opt.estimated_savings > 0 ? `₹${opt.estimated_savings.toLocaleString()}` : "₹0 (Baseline)"}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0F1422] border border-[#1E2638]">
                  <span className="text-[10px] text-zinc-400">Transit & Availability</span>
                  <p className="text-xs font-bold text-white mt-0.5 flex items-center gap-1">
                    <Clock size={13} className="text-amber-400" />
                    <span>{opt.lead_time_days} days</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0F1422] border border-[#1E2638]">
                  <span className="text-[10px] text-zinc-400">Schedule Delay Penalty</span>
                  <p
                    className={`text-xs font-bold mt-0.5 ${
                      opt.delay_risk_days > 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {opt.delay_risk_days > 0 ? `${opt.delay_risk_days} Days Late` : "0 Days (On Schedule)"}
                  </p>
                </div>
              </div>

              {/* Schedule Impact Statement */}
              <div className="p-3 rounded-lg bg-[#0E1320] border border-zinc-800 text-xs">
                <span className="font-bold text-zinc-400 text-[10px] uppercase">Schedule Impact:</span>
                <p className="text-zinc-200 mt-0.5">{opt.schedule_impact}</p>
              </div>

              {/* CTA */}
              <div className="pt-2 flex justify-end">
                {opt.is_recommended ? (
                  <Link
                    href="/approvals"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <span>Proceed to Approval Center</span>
                    <ArrowRight size={14} />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-500 text-xs font-medium cursor-not-allowed"
                  >
                    Secondary Alternative
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#111726] border border-[#232D42] rounded-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#232D42] pb-3">
              <div className="flex items-center gap-2">
                <GitCompare size={20} className="text-amber-400" />
                <h3 className="font-bold text-white text-base">Comprehensive Decision Matrix</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#232D42] text-zinc-400">
                    <th className="py-2.5 px-3">Decision Parameter</th>
                    {options.map((o) => (
                      <th key={o.id} className="py-2.5 px-3">
                        <span className={o.is_recommended ? "text-amber-400 font-bold" : "text-white font-semibold"}>
                          {o.title}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2638] text-zinc-300">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-zinc-400">Strategy Type</td>
                    {options.map((o) => (
                      <td key={o.id} className="py-2.5 px-3 font-semibold">{o.option_type}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-zinc-400">Lead Time</td>
                    {options.map((o) => (
                      <td key={o.id} className="py-2.5 px-3">{o.lead_time_days} days</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-zinc-400">Schedule Stoppage Delay</td>
                    {options.map((o) => (
                      <td key={o.id} className="py-2.5 px-3 font-bold text-emerald-400">
                        {o.delay_risk_days === 0 ? "0 Days" : `${o.delay_risk_days} Days Late (Stoppage)`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-zinc-400">Direct Cash Required</td>
                    {options.map((o) => (
                      <td key={o.id} className="py-2.5 px-3 font-mono font-bold text-white">
                        ₹{o.total_cost.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-zinc-400">Net Estimated Savings</td>
                    {options.map((o) => (
                      <td key={o.id} className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        ₹{o.estimated_savings.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-zinc-400">Policy Autonomy Level</td>
                    {options.map((o) => (
                      <td key={o.id} className="py-2.5 px-3 text-amber-400 font-semibold">YELLOW (Approval Required)</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3">
              <Link
                href="/approvals"
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all"
              >
                Go to Approval Center &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
