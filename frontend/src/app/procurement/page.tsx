"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ProcurementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch<any[]>("/procurement/orders");
      setOrders(data);
    } catch (e) {
      console.error("Failed to load POs:", e);
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
            <ShoppingCart className="text-amber-400" />
            Procurement & Purchase Orders
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {orders.length} Orders
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Supplier purchase orders, delivery status tracking, and contract fulfillment timelines.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading purchase orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#111726] border border-[#1E2638] text-center space-y-3">
          <ShoppingCart size={36} className="mx-auto text-zinc-500" />
          <h3 className="font-bold text-white text-base">No Purchase Orders Created Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            ConstructIQ recommends cross-project transfers before issuing commercial supplier POs to maximize cash savings.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-[#111726] border border-[#1E2638] overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0E1320] border-b border-[#1E2638] text-zinc-400 font-semibold">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Total Amount (₹)</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638] text-zinc-300">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-[#141B2D] transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                    {po.po_number}
                  </td>
                  <td className="py-3 px-4 text-white font-medium">{po.project_name}</td>
                  <td className="py-3 px-4">{po.supplier_name}</td>
                  <td className="py-3 px-4">{po.material_name}</td>
                  <td className="py-3 px-4 font-mono">{po.quantity.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    ₹{po.total_cost.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(po.expected_delivery_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {po.status}
                    </span>
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
