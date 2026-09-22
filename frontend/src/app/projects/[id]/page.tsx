"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Clock,
  Layers,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetail();
    }
  }, [projectId]);

  const fetchProjectDetail = async () => {
    try {
      const data = await apiFetch<any>(`/projects/${projectId}`);
      setProject(data);
    } catch (e) {
      console.error("Failed to load project:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading project schedule & inventory...</div>;
  }

  if (!project) {
    return <div className="p-12 text-center text-xs text-red-400">Project not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects"
          className="p-1.5 rounded-lg bg-[#141B2D] text-zinc-400 hover:text-white border border-[#1E2638]"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {project.code}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              {project.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">{project.name}</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-[#111726] border border-[#1E2638]">
          <span className="text-zinc-400">On-Site Inventory Value</span>
          <p className="text-xl font-bold text-white font-mono mt-1">
            ₹{(project.total_inventory_value / 100000).toFixed(2)}L
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#111726] border border-[#1E2638]">
          <span className="text-zinc-400">Schedule Activities</span>
          <p className="text-xl font-bold text-blue-400 mt-1">
            {project.schedule_activities?.length ?? 1} Tracked
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#111726] border border-red-500/30 bg-red-950/10">
          <span className="text-red-400">Material Shortages</span>
          <p className="text-xl font-bold text-red-400 mt-1">
            {project.shortages_count} Open Shortage
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#111726] border border-emerald-500/30 bg-emerald-950/10">
          <span className="text-emerald-400">Transferable Surplus</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            {project.surplus_count} Opportunities
          </p>
        </div>
      </div>

      {/* Timeline Connecting Schedule -> Requirement -> Inventory -> Procurement */}
      <div className="p-6 rounded-xl bg-[#111726] border border-[#1E2638] space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-3 border-b border-[#1E2638]">
          <Layers size={16} className="text-amber-400" />
          Schedule to Resource Intelligence Timeline
        </h3>

        <div className="space-y-4">
          {project.schedule_activities && project.schedule_activities.length > 0 ? (
            project.schedule_activities.map((act: any) => (
              <div key={act.id} className="p-4 rounded-lg bg-[#141B2D] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <h4 className="font-bold text-sm text-white">{act.activity_name}</h4>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    {new Date(act.start_date).toLocaleDateString()} &rarr; {new Date(act.end_date).toLocaleDateString()}
                  </span>
                </div>

                {/* Connected Flow */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2 text-xs">
                  <div className="p-2.5 rounded bg-[#0D121F] border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">1. SCHEDULE STAGE</span>
                    <p className="font-semibold text-white mt-0.5">{act.status}</p>
                    <p className="text-[10px] text-zinc-400">Foundation Rebar Placement</p>
                  </div>

                  <div className="p-2.5 rounded bg-[#0D121F] border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">2. REQUIRED MATERIAL</span>
                    <p className="font-semibold text-amber-400 mt-0.5">1,400 kg TMT Steel</p>
                    <p className="text-[10px] text-zinc-400">Needed by Day 7</p>
                  </div>

                  <div className="p-2.5 rounded bg-[#0D121F] border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">3. ON-SITE INVENTORY</span>
                    <p className="font-semibold text-red-400 mt-0.5">0 kg Available</p>
                    <p className="text-[10px] text-zinc-400">Deficit: 1,400 kg</p>
                  </div>

                  <div className="p-2.5 rounded bg-[#0D121F] border border-amber-500/30">
                    <span className="text-[10px] text-amber-400 uppercase font-mono">4. RECOMMENDED ACTION</span>
                    <p className="font-semibold text-emerald-400 mt-0.5">Transfer from Chennai</p>
                    <p className="text-[10px] text-zinc-400">Saves ₹48,272 & 0-day delay</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-zinc-400">No scheduled activities recorded.</p>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Link
            href="/approvals"
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>Review Pending Actions for Project</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
