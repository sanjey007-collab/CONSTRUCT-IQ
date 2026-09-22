"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const [policy, setPolicy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const data = await apiFetch<any>("/organizations/policy");
      setPolicy(data);
    } catch (e) {
      console.error("Failed to load policy:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    setSaving(true);
    try {
      await apiFetch("/organizations/policy", {
        method: "PUT",
        body: JSON.stringify(policy),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert(`Policy update failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading organization policy settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="text-amber-400" />
            Organization Governance & Autonomy Policies
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure financial spending limits, autonomy levels (Green/Yellow/Red), and mandatory human signoff rules.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Organization policies successfully updated and enforced!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Policy Section: Financial Thresholds */}
        <div className="p-6 rounded-xl bg-[#111726] border border-[#1E2638] space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-[#1E2638]">
            <Shield size={16} className="text-amber-400" />
            Autonomy Thresholds (Policy Rule §4.2)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-200">
                Max Autonomous Direct Procurement Limit (₹)
              </label>
              <input
                type="number"
                value={policy.max_autonomous_procurement}
                onChange={(e) =>
                  setPolicy({ ...policy, max_autonomous_procurement: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 rounded-lg bg-[#141B2D] border border-[#1E2638] text-white font-mono focus:outline-none focus:border-amber-500/60"
              />
              <p className="text-[11px] text-zinc-500">
                Procurements exceeding this amount automatically escalate to RED (Executive Only).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-200">
                Max Autonomous Inter-Site Transfer Logistics (₹)
              </label>
              <input
                type="number"
                value={policy.max_autonomous_transfer}
                onChange={(e) =>
                  setPolicy({ ...policy, max_autonomous_transfer: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2 rounded-lg bg-[#141B2D] border border-[#1E2638] text-white font-mono focus:outline-none focus:border-amber-500/60"
              />
              <p className="text-[11px] text-zinc-500">
                Logistics expenditure limit before requiring senior director approval.
              </p>
            </div>
          </div>
        </div>

        {/* Safety & Supplier Governance */}
        <div className="p-6 rounded-xl bg-[#111726] border border-[#1E2638] space-y-4 text-xs">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-[#1E2638]">
            <Lock size={16} className="text-blue-400" />
            Risk & Separation-of-Duties Rules
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.require_approval_new_supplier}
                onChange={(e) =>
                  setPolicy({ ...policy, require_approval_new_supplier: e.target.checked })
                }
                className="w-4 h-4 rounded bg-[#141B2D] border-[#1E2638] text-amber-500 focus:ring-0"
              />
              <div>
                <p className="font-semibold text-white">Always Require Human Approval for New Suppliers</p>
                <p className="text-[11px] text-zinc-400">Never allow the agent to autonomously contract unverified vendors.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.require_approval_safety_critical}
                onChange={(e) =>
                  setPolicy({ ...policy, require_approval_safety_critical: e.target.checked })
                }
                className="w-4 h-4 rounded bg-[#141B2D] border-[#1E2638] text-amber-500 focus:ring-0"
              />
              <div>
                <p className="font-semibold text-white">Mandatory Review for Safety-Critical Materials</p>
                <p className="text-[11px] text-zinc-400">All structural steel, high-tensile rebar, and load-bearing concrete.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policy.separation_of_duties}
                onChange={(e) =>
                  setPolicy({ ...policy, separation_of_duties: e.target.checked })
                }
                className="w-4 h-4 rounded bg-[#141B2D] border-[#1E2638] text-amber-500 focus:ring-0"
              />
              <div>
                <p className="font-semibold text-white">Enforce Dual-Signoff Separation of Duties</p>
                <p className="text-[11px] text-zinc-400">Requesters cannot self-approve inter-site transfers or high-value purchase orders.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={15} />
            <span>{saving ? "Saving Policies..." : "Save & Enforce Policies"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
