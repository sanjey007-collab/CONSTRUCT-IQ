"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Search,
  Filter,
  Building2,
  Boxes,
  ArrowUpDown
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const data = await apiFetch<any[]>("/inventory");
      setInventory(data);
    } catch (e) {
      console.error("Failed to load inventory:", e);
    } finally {
      setLoading(false);
    }
  };

  const projects = ["ALL", ...Array.from(new Set(inventory.map((i) => i.project_name)))];

  const filtered = inventory.filter((item) => {
    const matchesSearch = item.material_name.toLowerCase().includes(search.toLowerCase());
    const matchesProj = projectFilter === "ALL" || item.project_name === projectFilter;
    return matchesSearch && matchesProj;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Package className="text-purple-400" />
            Project & Site Inventory Stock
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {filtered.length} Yard Allocations
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time material availability calculated dynamically: Available = Current - Reserved - Damaged.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search materials in inventory..."
          className="px-4 py-2 text-xs rounded-lg bg-[#141B2D] border border-[#1E2638] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 w-full sm:w-80"
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {projects.map((p) => (
            <button
              key={p}
              onClick={() => setProjectFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                projectFilter === p
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold"
                  : "bg-[#111726] text-zinc-400 border-[#1E2638] hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading project inventory yard counts...</div>
      ) : (
        <div className="rounded-xl bg-[#111726] border border-[#1E2638] overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0E1320] border-b border-[#1E2638] text-zinc-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Project & Yard</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Reserved</th>
                <th className="py-3 px-4">In Transit</th>
                <th className="py-3 px-4">Damaged</th>
                <th className="py-3 px-4 text-emerald-400">Available Stock</th>
                <th className="py-3 px-4">Valuation (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638] text-zinc-300">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-[#141B2D] transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">{i.project_name}</p>
                    <p className="text-[10px] text-zinc-500">{i.site_name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-white">{i.material_name}</p>
                    <span className="text-[10px] text-zinc-400 font-mono">₹{i.unit_cost}/{i.unit}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {i.current_quantity.toLocaleString()} {i.unit}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-400">
                    {i.reserved_quantity.toLocaleString()} {i.unit}
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-400">
                    {i.incoming_quantity > 0 ? `+${i.incoming_quantity.toLocaleString()} ${i.unit}` : "-"}
                  </td>
                  <td className="py-3 px-4 font-mono text-red-400">
                    {i.damaged_quantity > 0 ? `${i.damaged_quantity.toLocaleString()} ${i.unit}` : "-"}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400 bg-emerald-950/10">
                    {i.available_quantity.toLocaleString()} {i.unit}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-zinc-200">
                    ₹{i.inventory_value.toLocaleString()}
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
