"use client";

import { useEffect, useState } from "react";
import {
  Boxes,
  TrendingUp,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  DollarSign
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const data = await apiFetch<any[]>("/materials");
      setMaterials(data);
    } catch (e) {
      console.error("Failed to load materials:", e);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["ALL", ...Array.from(new Set(materials.map((m) => m.category)))];

  const filtered = materials.filter((m) => {
    const matchesSearch = m.material_name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Boxes className="text-amber-400" />
            Material Master Intelligence Catalog
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {materials.length} Commodities
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Standard specifications, safety stocks, unit costs, and lead times across structural and finishing commodities.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by material name or category..."
          className="px-4 py-2 text-xs rounded-lg bg-[#141B2D] border border-[#1E2638] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 w-full sm:w-80"
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                  : "bg-[#111726] text-zinc-400 border-[#1E2638] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading material catalog...</div>
      ) : (
        <div className="rounded-xl bg-[#111726] border border-[#1E2638] overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0E1320] border-b border-[#1E2638] text-zinc-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Material Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Cost (₹)</th>
                <th className="py-3 px-4">Safety Buffer</th>
                <th className="py-3 px-4">Supplier Lead Time</th>
                <th className="py-3 px-4">Specification Group</th>
                <th className="py-3 px-4">Criticality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638] text-zinc-300">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[#141B2D] transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    {m.material_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono text-[10px]">
                      {m.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    ₹{m.unit_cost.toLocaleString()} <span className="text-[10px] text-zinc-500 font-normal">/ {m.unit}</span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {m.safety_stock.toLocaleString()} {m.unit}
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 font-mono text-zinc-300">
                      <Clock size={12} className="text-amber-400" />
                      {m.lead_time_days} days
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                    {m.compatible_material_group}
                  </td>
                  <td className="py-3 px-4">
                    {m.is_safety_critical ? (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                        Safety Critical
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[10px]">Standard</span>
                    )}
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
