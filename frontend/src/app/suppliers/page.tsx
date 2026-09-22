"use client";

import { useEffect, useState } from "react";
import {
  Truck,
  Star,
  Clock,
  ShieldCheck,
  MapPin,
  CreditCard
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await apiFetch<any[]>("/suppliers");
      setSuppliers(data);
    } catch (e) {
      console.error("Failed to load suppliers:", e);
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
            <Truck className="text-amber-400" />
            Approved Supplier & Logistics Directory
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              DEMO DATA LABELED
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Regional manufacturers and logistics providers with SLA ratings, fulfillment lead times, and payment terms.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading supplier network...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-xl bg-[#111726] border border-[#1E2638] hover:border-zinc-700 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-white">{s.name}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    DEMO VENDOR
                  </span>
                </div>

                <p className="text-xs text-zinc-400 flex items-center gap-1">
                  <MapPin size={12} className="text-amber-400" />
                  <span>{s.location}</span>
                </p>

                <div className="pt-2 border-t border-[#1E2638] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Quality Rating:</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Star size={12} fill="currentColor" />
                      <span>{s.rating} / 5.0</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Avg Lead Time:</span>
                    <span className="font-mono text-white flex items-center gap-1">
                      <Clock size={12} className="text-zinc-400" />
                      <span>{s.average_lead_time} days</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Fulfillment Reliability:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {(s.reliability_score * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Payment Terms:</span>
                    <span className="text-zinc-300 font-medium">{s.payment_terms}</span>
                  </div>
                </div>

                {/* Supported Materials */}
                <div className="pt-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">Supported Commodities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.materials_supported?.map((mat: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#141B2D] text-zinc-300 border border-zinc-800"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
