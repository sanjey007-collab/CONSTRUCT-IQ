"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Package,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Bot,
  CheckCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  DollarSign
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface DashboardKpis {
  active_projects: number;
  total_inventory_value: number;
  predicted_shortages_count: number;
  potential_surplus_count: number;
  procurement_exposure: number;
  estimated_savings_identified: number;
  estimated_savings_realized: number;
  waste_avoided_kg: number;
  actions_awaiting_approval: number;
  is_demo_data: boolean;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentTriggered, setAgentTriggered] = useState(false);

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    try {
      const data = await apiFetch<DashboardKpis>("/analytics/dashboard");
      setKpis(data);
    } catch (e) {
      console.error("Failed to load dashboard KPIs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgent = async () => {
    setRunningAgent(true);
    try {
      await apiFetch("/agent/run", { method: "POST" });
      setAgentTriggered(true);
      fetchKpis();
      setTimeout(() => setAgentTriggered(false), 4000);
    } catch (e) {
      console.error("Failed to trigger agent cycle:", e);
    } finally {
      setRunningAgent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Agent Trigger Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Resource Operations Command
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Live Monitoring
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time material forecasting, cross-project redistribution, and procurement intelligence across 5 active projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAgent}
            disabled={runningAgent}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
          >
            <Bot size={16} className={runningAgent ? "animate-spin" : ""} />
            <span>{runningAgent ? "Running AI Optimizer..." : "Run AI Optimization Cycle"}</span>
          </button>
        </div>
      </div>

      {/* Hero AHA Moment Alert Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#1A1811] via-[#1C1A14] to-[#121622] border border-amber-500/40 p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-black uppercase tracking-wider">
                  HERO OPPORTUNITY IDENTIFIED
                </span>
                <span className="text-xs text-amber-300/80 font-mono">Confidence: 96%</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Madurai 1,400 kg TMT Shortage matched with Chennai 1,500 kg TMT Surplus
              </h3>
              <p className="text-xs text-zinc-300 mt-1 max-w-3xl leading-relaxed">
                Supplier standard lead time is <strong>10 days</strong> (causing 3-day work stoppage & ₹45,000 delay penalty). 
                Transferring 1,400 kg surplus from Chennai arrives in <strong>2 days</strong>, averts schedule delay, and yields{" "}
                <strong className="text-emerald-400">₹48,272 net savings</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <Link
              href="/approvals"
              className="w-full md:w-auto text-center px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Review & Approve Transfer</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Active Projects */}
        <div className="p-4 rounded-xl bg-[#111726] border border-[#1E2638] hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Active Projects</span>
            <Building2 size={16} className="text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpis?.active_projects ?? 5}</span>
            <span className="text-[11px] text-emerald-400 flex items-center font-medium">100% Tracked</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Tamil Nadu Operations</p>
        </div>

        {/* Card 2: Material Inventory Value */}
        <div className="p-4 rounded-xl bg-[#111726] border border-[#1E2638] hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Total Inventory Value</span>
            <Package size={16} className="text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              ₹{kpis ? (kpis.total_inventory_value / 100000).toFixed(2) : "39.25"}L
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">14 categories</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Managed on-site assets</p>
        </div>

        {/* Card 3: Predicted Shortages */}
        <div className="p-4 rounded-xl bg-[#111726] border border-red-500/30 hover:border-red-500/50 transition-all bg-red-950/10">
          <div className="flex items-center justify-between text-red-400 text-xs font-medium">
            <span>Predicted Shortages</span>
            <AlertTriangle size={16} className="text-red-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-400">{kpis?.predicted_shortages_count ?? 1}</span>
            <span className="text-[11px] text-red-300 font-semibold px-1.5 py-0.5 rounded bg-red-500/20">Critical</span>
          </div>
          <p className="text-[11px] text-red-400/80 mt-1">Madurai TMT Steel (7d)</p>
        </div>

        {/* Card 4: Potential Surplus */}
        <div className="p-4 rounded-xl bg-[#111726] border border-emerald-500/30 hover:border-emerald-500/50 transition-all bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Actionable Surplus</span>
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{kpis?.potential_surplus_count ?? 8}</span>
            <span className="text-[11px] text-emerald-300 font-medium">Available</span>
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-1">Chennai TMT (1,500 kg)</p>
        </div>

        {/* Card 5: Estimated Savings Identified */}
        <div className="p-4 rounded-xl bg-[#111726] border border-amber-500/30 hover:border-amber-500/50 transition-all bg-amber-950/10">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>Identified Savings</span>
            <TrendingUp size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">
              ₹{kpis?.estimated_savings_identified ? kpis.estimated_savings_identified.toLocaleString() : "48,272"}
            </span>
          </div>
          <p className="text-[11px] text-amber-400/80 mt-1">Via cross-site transfer</p>
        </div>

        {/* Card 6: Actions Awaiting Approval */}
        <div className="p-4 rounded-xl bg-[#111726] border border-[#1E2638] hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Pending Approvals</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpis?.actions_awaiting_approval ?? 1}</span>
            <span className="text-[11px] text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-500/20">Action Req.</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">1 Transfer Order</p>
        </div>

        {/* Card 7: Waste Avoidance */}
        <div className="p-4 rounded-xl bg-[#111726] border border-[#1E2638] hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Potential Waste Avoided</span>
            <ShieldCheck size={16} className="text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">1,400 kg</span>
            <span className="text-[11px] text-teal-400 font-medium">Zero scrap loss</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Surplus repurposed</p>
        </div>

        {/* Card 8: Procurement Exposure */}
        <div className="p-4 rounded-xl bg-[#111726] border border-[#1E2638] hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Emergency PO Avoided</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">₹89,500</span>
            <span className="text-[11px] text-emerald-300 font-mono">100% saved</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Eliminated spot rush fee</p>
        </div>
      </div>

      {/* Main Grid: Live Agent Feed & Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Agent Activity Timeline & Comparison Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Activity Timeline Card */}
          <div className="p-5 rounded-xl bg-[#111726] border border-[#1E2638]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm text-white">Live AI Agent Operations Stream</h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Autonomous Cycle #CR-2026-92</span>
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Step 1 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                  !
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">Detected critical shortage risk: TMT Reinforcement Steel</p>
                    <span className="text-[10px] text-zinc-500 font-mono">09:41</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Madurai Commercial Complex requires 1,400 kg for raft foundation pouring within 7 days. On-site available stock is 0 kg.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                  Q
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">Queried cross-project surplus inventories</p>
                    <span className="text-[10px] text-zinc-500 font-mono">09:42</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Discovered 1,500 kg compatible Fe 550D surplus at Chennai Residential Tower yard (2,300 kg total minus 800 kg reserved).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                  ∑
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">Calculated Transfer Economics vs Supplier Lead Time</p>
                    <span className="text-[10px] text-zinc-500 font-mono">09:43</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Freight (460 km) + Handling = ₹13,650 (2-day transit). Mill reorder arrives on Day 10, creating 3-day work stoppage penalty.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                  ★
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-amber-300">Generated Recommendation & Approval Package</p>
                    <span className="text-[10px] text-zinc-500 font-mono">09:44</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    ConstructIQ policy requires dual signoff for inter-site transfers. Routed to Procurement & Project Managers.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E2638] flex items-center justify-between">
              <Link href="/agent" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
                <span>Open Full Agent Command Center</span>
                <ArrowRight size={13} />
              </Link>
              <span className="text-[11px] text-zinc-500">Last scanned: 2 mins ago</span>
            </div>
          </div>

          {/* Quick Action Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/optimization"
              className="p-3 rounded-lg bg-[#111726] border border-[#1E2638] hover:border-amber-500/50 hover:bg-[#161F33] transition-all text-center group"
            >
              <Truck size={20} className="mx-auto text-amber-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-white mt-2">Matching Matrix</p>
              <p className="text-[10px] text-zinc-400">Surplus redistribution</p>
            </Link>

            <Link
              href="/shortages"
              className="p-3 rounded-lg bg-[#111726] border border-[#1E2638] hover:border-red-500/50 hover:bg-[#161F33] transition-all text-center group"
            >
              <AlertTriangle size={20} className="mx-auto text-red-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-white mt-2">Shortage Radar</p>
              <p className="text-[10px] text-zinc-400">1 critical risk</p>
            </Link>

            <Link
              href="/forecast"
              className="p-3 rounded-lg bg-[#111726] border border-[#1E2638] hover:border-blue-500/50 hover:bg-[#161F33] transition-all text-center group"
            >
              <TrendingUp size={20} className="mx-auto text-blue-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-white mt-2">60-Day Forecast</p>
              <p className="text-[10px] text-zinc-400">Schedule activities</p>
            </Link>

            <Link
              href="/analytics"
              className="p-3 rounded-lg bg-[#111726] border border-[#1E2638] hover:border-emerald-500/50 hover:bg-[#161F33] transition-all text-center group"
            >
              <DollarSign size={20} className="mx-auto text-emerald-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-white mt-2">ROI Analytics</p>
              <p className="text-[10px] text-zinc-400">12.8x platform ROI</p>
            </Link>
          </div>
        </div>

        {/* Right Col: Active Projects Status Overview */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#111726] border border-[#1E2638]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Building2 size={16} className="text-blue-400" />
                Project Resource Status
              </h3>
              <Link href="/projects" className="text-xs text-amber-400 hover:underline">
                View all (5)
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {/* Project 1: Madurai */}
              <div className="p-3 rounded-lg bg-[#141B2D] border border-red-500/30">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs text-white">Madurai Commercial Complex</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                    Shortage Risk
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Rebar Shortage: 1,400 kg</span>
                  <span className="text-amber-400 font-semibold">Day 7 pour deadline</span>
                </div>
              </div>

              {/* Project 2: Chennai */}
              <div className="p-3 rounded-lg bg-[#141B2D] border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs text-white">Chennai Residential Tower</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Surplus Available
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>TMT Steel Surplus: 1,500 kg</span>
                  <span className="text-emerald-400 font-semibold">Transfer Ready</span>
                </div>
              </div>

              {/* Project 3: Coimbatore */}
              <div className="p-3 rounded-lg bg-[#141B2D] border border-[#1E2638]">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs text-white">Coimbatore Industrial Facility</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    Balanced
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Cement: 450 bags on site</span>
                  <span>Adequate buffer</span>
                </div>
              </div>

              {/* Project 4: Trichy */}
              <div className="p-3 rounded-lg bg-[#141B2D] border border-[#1E2638]">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs text-white">Trichy Hospital Expansion</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    Balanced
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Finishing & Formwork</span>
                  <span>On schedule</span>
                </div>
              </div>

              {/* Project 5: Tirunelveli */}
              <div className="p-3 rounded-lg bg-[#141B2D] border border-[#1E2638]">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs text-white">Tirunelveli Infrastructure Project</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    Active
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Aggregates: 180 tons</span>
                  <span>Procurement open</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
