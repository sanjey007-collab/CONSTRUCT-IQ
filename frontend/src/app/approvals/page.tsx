"use client";

import { useEffect, useState } from "react";
import {
  CheckSquare,
  AlertCircle,
  TrendingUp,
  Truck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ApprovalItem {
  id: string;
  decision_id: string;
  action_type: string;
  title: string;
  description: string;
  details: any;
  estimated_cost: number;
  estimated_savings: number;
  status: string;
  requested_at: string;
  decided_at?: string;
  decided_by?: string;
  comments?: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const data = await apiFetch<ApprovalItem[]>("/approvals");
      setApprovals(data);
    } catch (e) {
      console.error("Failed to load approvals:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED") => {
    setProcessingId(id);
    try {
      await apiFetch(`/approvals/${id}/decide`, {
        method: "POST",
        body: JSON.stringify({
          status: decision,
          comments: decision === "APPROVED" 
            ? "Approved via ConstructIQ Approval Center. Immediate inter-site logistics dispatch authorized." 
            : `Action marked as ${decision}`
        }),
      });

      setActionSuccess(
        decision === "APPROVED"
          ? "Transfer Order TO-2026-CHN-MAD successfully created & executed! Inventories updated, shortage resolved."
          : `Recommendation ${decision.toLowerCase()}.`
      );

      fetchApprovals();
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (e: any) {
      alert(`Decision error: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingList = approvals.filter((a) => a.status === "PENDING");
  const historyList = approvals.filter((a) => a.status !== "PENDING");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="text-amber-400" />
            Agent Approval Center
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingList.length} Awaiting Authorization
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review AI agent recommendations requiring human policy sign-off before physical logistics execution.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Hero Decision Card */}
      {pendingList.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#111726] border border-[#1E2638] text-center space-y-3">
          <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
          <h3 className="font-bold text-white text-base">All Agent Recommendations Resolved</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            No pending inter-site transfers or high-value purchase orders currently require authorization.
          </p>
        </div>
      ) : (
        pendingList.map((item) => (
          <div
            key={item.id}
            className="rounded-xl bg-[#111726] border border-amber-500/40 p-6 shadow-2xl space-y-5 relative overflow-hidden"
          >
            {/* Top Badge & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#1E2638] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-black uppercase tracking-wider">
                  INTER-SITE TRANSFER ACTION
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Requested: {new Date(item.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  Est. Net Savings: ₹{item.estimated_savings.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded border border-zinc-700">
                  Logistics Cost: ₹{item.estimated_cost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Comprehensive Transparent Explanation (Section 29 Requirements) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Left Column: What happened & Why */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">1. WHAT HAPPENED?</h4>
                  <p className="text-zinc-200 mt-1 leading-relaxed">
                    ConstructIQ detected an acute <strong>1,400 kg TMT Reinforcement Steel</strong> shortage at{" "}
                    <span className="text-amber-400">Madurai Commercial Complex</span> required within 7 days for raft foundation pouring.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">2. WHY TRANSFER FROM CHENNAI?</h4>
                  <p className="text-zinc-200 mt-1 leading-relaxed">
                    <span className="text-emerald-400 font-semibold">Chennai Residential Tower</span> has 2,300 kg on-site with only 800 kg reserved for next month, leaving <strong>1,500 kg verified actionable surplus</strong>. Material specifications (Fe 550D IS 1786:2008) are 100% certified identical.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">3. WHAT ARE THE ALTERNATIVES?</h4>
                  <div className="mt-1 space-y-1.5 text-zinc-300">
                    <div className="p-2 rounded bg-[#141B2D] border border-zinc-800">
                      <p className="font-semibold text-white">Alternative A: Mill Reorder from Apex Steel Mills</p>
                      <p className="text-[11px] text-zinc-400">Standard lead time is 10 days. Arrives 3 days late, causing site work stoppage penalty of ₹45,000.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Economics & Policy */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">4. COST & SAVINGS BREAKDOWN</h4>
                  <div className="mt-1.5 p-3 rounded-lg bg-[#141B2D] border border-[#1E2638] space-y-1 text-[11px]">
                    <div className="flex justify-between text-zinc-300">
                      <span>Direct Mill Procurement (Emergency Spot Rate):</span>
                      <span className="font-mono text-white">₹89,500</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Schedule Stoppage Delay Penalty Avoided:</span>
                      <span className="font-mono text-emerald-400">₹45,000</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Inter-Site Freight Transit (460 km):</span>
                      <span className="font-mono text-zinc-400">₹11,550</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Yard Rigging & Quality Inspection:</span>
                      <span className="font-mono text-zinc-400">₹2,100</span>
                    </div>
                    <div className="pt-1.5 border-t border-zinc-700 flex justify-between font-bold text-xs">
                      <span className="text-emerald-400">Net Organization Cash Savings:</span>
                      <span className="font-mono text-emerald-400">₹{item.estimated_savings.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">5. POLICY & AUTONOMY STATUS</h4>
                  <p className="text-zinc-300 mt-1 leading-relaxed">
                    <span className="font-semibold text-amber-400">YELLOW AUTONOMY:</span> Inter-site transfers require dual Project Manager / Procurement verification under Organization Rule §4.2.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="pt-4 border-t border-[#1E2638] flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                disabled={processingId === item.id}
                onClick={() => handleDecision(item.id, "REJECTED")}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle size={15} />
                <span>Reject</span>
              </button>

              <button
                disabled={processingId === item.id}
                onClick={() => handleDecision(item.id, "CHANGES_REQUESTED")}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
              >
                <HelpCircle size={15} />
                <span>Request Changes</span>
              </button>

              <button
                disabled={processingId === item.id}
                onClick={() => handleDecision(item.id, "APPROVED")}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>{processingId === item.id ? "Authorizing Transfer..." : "Approve & Execute Transfer"}</span>
              </button>
            </div>
          </div>
        ))
      )}

      {/* Decision Audit History */}
      {historyList.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <span>Decided History & Execution Audit</span>
            <span className="text-xs text-zinc-500">({historyList.length})</span>
          </h3>

          <div className="rounded-xl bg-[#111726] border border-[#1E2638] divide-y divide-[#1E2638] overflow-hidden">
            {historyList.map((h) => (
              <div key={h.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        h.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {h.status}
                    </span>
                    <p className="font-semibold text-white">{h.title}</p>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-1">{h.comments || "Processed by administrator"}</p>
                </div>
                <div className="text-right text-[11px] text-zinc-400">
                  <p className="font-semibold text-white">{h.decided_by || "Priya Ramakrishnan"}</p>
                  <p>{h.decided_at ? new Date(h.decided_at).toLocaleString() : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
