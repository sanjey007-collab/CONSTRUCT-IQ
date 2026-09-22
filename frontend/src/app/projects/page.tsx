"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  MapPin,
  Clock
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await apiFetch<any[]>("/projects");
      setProjects(data);
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="text-blue-400" />
            Project Resource Operations
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {projects.length} Active Sites
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Overview of commercial, residential, and infrastructure job sites under active material forecasting.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading projects portfolio...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-xl bg-[#111726] border border-[#1E2638] hover:border-zinc-700 transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {p.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    {p.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-2.5">{p.name}</h3>
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-amber-400" />
                  <span>{p.location}</span>
                </p>

                <div className="mt-4 pt-3 border-t border-[#1E2638] space-y-2 text-xs text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Client:</span>
                    <span className="font-medium text-white">{p.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Project Budget:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ₹{(p.budget / 10000000).toFixed(2)} Cr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Project Manager:</span>
                    <span>{p.project_manager}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Site Engineer:</span>
                    <span>{p.site_manager}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E2638] flex items-center justify-between">
                <Link
                  href={`/projects/${p.id}`}
                  className="w-full text-center py-2 rounded-lg bg-[#141B2D] hover:bg-[#1A2338] text-amber-400 text-xs font-semibold border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>View Material Schedule & Yard</span>
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
