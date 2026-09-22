"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu,
  Terminal,
  Layers
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const PROMPT_SUGGESTIONS = [
  "Show me materials at risk in the next 14 days.",
  "Where do we have excess cement?",
  "Find opportunities to reuse materials across projects.",
  "Why is Project B (Madurai) at risk?",
  "Compare procurement versus transfer for TMT steel.",
  "Show me today's recommended actions."
];

export default function AgentCenterPage() {
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [answerData, setAnswerData] = useState<{
    answer: string;
    reasoning: string;
    sources_used: string[];
    suggested_actions?: any[];
  } | null>(null);

  const [timeline, setTimeline] = useState<any[]>([]);
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentSummary, setAgentSummary] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const data = await apiFetch<any[]>("/agent/timeline");
      setTimeline(data);
    } catch (e) {
      console.error("Failed to fetch timeline:", e);
    }
  };

  const handleAsk = async (text: string) => {
    const q = text || query;
    if (!q.trim()) return;
    setAsking(true);
    setQuery(q);
    try {
      const res = await apiFetch<any>("/agent/command", {
        method: "POST",
        body: JSON.stringify({ prompt: q }),
      });
      setAnswerData(res);
    } catch (e: any) {
      alert(`Query failed: ${e.message}`);
    } finally {
      setAsking(false);
    }
  };

  const handleRunAgentCycle = async () => {
    setRunningAgent(true);
    setAgentSummary(null);
    try {
      const run = await apiFetch<any>("/agent/run", { method: "POST" });
      setAgentSummary(run.summary || "Agent cycle completed successfully.");
      fetchTimeline();
    } catch (e: any) {
      alert(`Agent run failed: ${e.message}`);
    } finally {
      setRunningAgent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bot className="text-amber-400" />
            AI Operations Agent Command Center
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active Autonomy: Policy-Governed
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Autonomous construction resource agent utilizing deterministic calculations and controlled domain tools.
          </p>
        </div>

        <button
          disabled={runningAgent}
          onClick={handleRunAgentCycle}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={runningAgent ? "animate-spin" : ""} />
          <span>{runningAgent ? "Executing 12-Step Cycle..." : "Trigger Autonomous Optimization Cycle"}</span>
        </button>
      </div>

      {agentSummary && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-3 animate-in fade-in">
          <Sparkles size={18} className="text-amber-400 shrink-0" />
          <span className="font-semibold">{agentSummary}</span>
        </div>
      )}

      {/* Natural Language Command Bar */}
      <div className="p-5 rounded-xl bg-[#111726] border border-[#1E2638] space-y-3">
        <label className="text-xs font-bold text-white flex items-center gap-2">
          <Terminal size={15} className="text-amber-400" />
          Ask ConstructIQ Operations Agent
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk(query)}
            placeholder="Ask about project risks, surplus materials, transfer comparisons, or supplier lead times..."
            className="flex-1 px-4 py-2.5 text-xs rounded-lg bg-[#141B2D] border border-[#1E2638] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
          />
          <button
            disabled={asking || !query.trim()}
            onClick={() => handleAsk(query)}
            className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send size={14} />
            <span>{asking ? "Reasoning..." : "Ask"}</span>
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {PROMPT_SUGGESTIONS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(p)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#182136] hover:bg-[#202C48] text-zinc-300 hover:text-white border border-zinc-700/60 transition-all text-left"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Query Answer Card */}
      {answerData && (
        <div className="p-5 rounded-xl bg-[#141B2D] border border-amber-500/30 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Sparkles size={16} />
              <span>ConstructIQ Agent Synthesis</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Grounding: {answerData.sources_used.join(", ")}
            </span>
          </div>

          <div className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line font-normal">
            {answerData.answer}
          </div>

          <div className="pt-3 border-t border-[#1E2638] flex items-center justify-between text-[11px] text-zinc-400">
            <span className="italic">{answerData.reasoning}</span>
            <div className="flex gap-2">
              <a href="/approvals" className="text-amber-400 hover:underline font-semibold">
                Go to Approvals &rarr;
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column: Agent State Machine & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 12-Step Autonomous Workflow Visualization */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-xl bg-[#111726] border border-[#1E2638] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers size={16} className="text-blue-400" />
                ConstructIQ 12-Step Agent Optimization Loop
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono">Loop Status: STABLE</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
              {[
                { step: "01", title: "Observe Data", desc: "Scan schedules & BOQs", status: "DONE" },
                { step: "02", title: "Detect Anomalies", desc: "Identify variance trends", status: "DONE" },
                { step: "03", title: "Forecast Imbalance", desc: "Shortage & surplus radar", status: "DONE" },
                { step: "04", title: "Search Projects", desc: "Query cross-site surplus", status: "DONE" },
                { step: "05", title: "Search Suppliers", desc: "Pull quotes & lead times", status: "DONE" },
                { step: "06", title: "Generate Options", desc: "Transfer / Mill / Split", status: "DONE" },
                { step: "07", title: "Calculate Economics", desc: "Transit vs delay penalty", status: "DONE" },
                { step: "08", title: "Apply Org Policy", desc: "Check ₹25k / ₹50k limits", status: "DONE" },
                { step: "09", title: "Autonomy Router", desc: "Flag Yellow approval", status: "DONE" },
                { step: "10", title: "Recommend Action", desc: "Transparent rationale", status: "DONE" },
                { step: "11", title: "Audit Log Entry", desc: "Immutable trail record", status: "DONE" },
                { step: "12", title: "Notify & Execute", desc: "Dispatched to PM", status: "DONE" },
              ].map((s) => (
                <div key={s.step} className="p-2.5 rounded-lg bg-[#141B2D] border border-[#1E2638]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>STEP {s.step}</span>
                    <span className="text-emerald-400 font-semibold">{s.status}</span>
                  </div>
                  <p className="font-bold text-white text-xs mt-1">{s.title}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Full Agent Transparency Card (Section 53 Requirements) */}
          <div className="p-5 rounded-xl bg-[#111726] border border-[#1E2638] space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-[#1E2638]">
              <Shield size={16} className="text-amber-400" />
              Agent Transparency & Explainability Specimen
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#141B2D] border border-zinc-800">
                <span className="font-bold text-amber-400 uppercase tracking-wide text-[10px]">Observation</span>
                <p className="text-zinc-200 mt-0.5">
                  1,400 kg TMT steel needed at Madurai in 7 days for raft pour. Stock is 0 kg.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#141B2D] border border-zinc-800">
                <span className="font-bold text-blue-400 uppercase tracking-wide text-[10px]">Evidence</span>
                <p className="text-zinc-200 mt-0.5">
                  Chennai yard has 2,300 kg stock with 800 kg scheduled requirement &rarr; 1,500 kg actionable surplus.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#141B2D] border border-zinc-800">
                <span className="font-bold text-purple-400 uppercase tracking-wide text-[10px]">Alternatives Considered</span>
                <p className="text-zinc-200 mt-0.5">
                  Option 1: Inter-site road transfer (2 days, ₹13,650 cost, ₹48,272 net savings).<br/>
                  Option 2: Direct supplier procurement (10 days lead time, 3 days late, ₹45,000 stoppage penalty).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#141B2D] border border-zinc-800">
                <span className="font-bold text-emerald-400 uppercase tracking-wide text-[10px]">Decision Rationale</span>
                <p className="text-zinc-200 mt-0.5">
                  Transfer recommended due to 0-day delay risk, verified material grade Fe 550D compatibility, and ₹48,272 cash savings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Tool Invocation Stream */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#111726] border border-[#1E2638] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Cpu size={16} className="text-amber-400" />
                Controlled Tool Stream
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">17 Tools Ready</span>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No tool calls logged yet.</p>
              ) : (
                timeline.map((tc) => (
                  <div key={tc.id} className="p-2.5 rounded-lg bg-[#141B2D] border border-[#1E2638] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-amber-300 text-[11px] truncate">
                        {tc.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{tc.execution_time_ms}ms</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="text-emerald-400 font-semibold">{tc.status}</span>
                      <span>{new Date(tc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
