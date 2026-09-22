"use client";

import { useState, useEffect } from "react";
import {
  RotateCcw,
  User,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  ChevronDown
} from "lucide-react";
import { apiFetch, setAuthToken, setCurrentUserRole, getCurrentUserRole } from "@/lib/api";

const ROLES = [
  { id: "PROCUREMENT_MANAGER", label: "Procurement Manager", name: "Priya Ramakrishnan" },
  { id: "PROJECT_MANAGER", label: "Project Manager", name: "Karthik Venkatesh" },
  { id: "ADMIN", label: "Company Admin", name: "Aravind Swaminathan" },
  { id: "SITE_ENGINEER", label: "Site Engineer", name: "Muthu Kumar" },
  { id: "FINANCE_MANAGER", label: "Finance Director", name: "Deepa Sundaram" },
  { id: "VIEWER", label: "Auditor / Viewer", name: "Rahul Sharma" }
];

export function Header() {
  const [currentRole, setCurrentRole] = useState("PROCUREMENT_MANAGER");
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    setCurrentRole(getCurrentUserRole());
  }, []);

  const handleRoleChange = async (roleId: string) => {
    try {
      const res = await apiFetch<{ access_token: string; user: { role: string } }>(
        `/auth/switch-demo-user/${roleId}`,
        { method: "POST" }
      );
      setAuthToken(res.access_token);
      setCurrentUserRole(roleId);
      setCurrentRole(roleId);
      setShowRoleMenu(false);
      window.location.reload();
    } catch (e) {
      console.error("Failed to switch role:", e);
    }
  };

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await apiFetch("/demo/reset", { method: "POST" });
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setShowResetModal(false);
        window.location.reload();
      }, 1200);
    } catch (e) {
      console.error("Reset failed:", e);
    } finally {
      setResetting(false);
    }
  };

  const activeRoleObj = ROLES.find((r) => r.id === currentRole) || ROLES[0];

  return (
    <header className="h-16 border-b border-[#1E2638] bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Search & Organization Context */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141B2D] border border-[#1E2638] text-xs text-zinc-300">
          <Building size={14} className="text-amber-400" />
          <span className="font-semibold text-white">Apex Infrastructure & Builders</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono border border-amber-500/30">
            DEMO MODE
          </span>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search projects, materials, POs..."
            className="w-64 md:w-80 pl-9 pr-4 py-1.5 text-xs rounded-lg bg-[#141B2D] border border-[#1E2638] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Autonomy Badge, Role Switcher, Demo Reset */}
      <div className="flex items-center gap-3">
        {/* Agent Autonomy Indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-semibold text-[11px]">Autonomy: YELLOW (Approval Required)</span>
        </div>

        {/* Demo Reset Button */}
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E2638] hover:bg-[#28334A] text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition-all"
          title="Reset back to Hero Demo scenario"
        >
          <RotateCcw size={13} className="text-amber-400" />
          <span>Reset Demo</span>
        </button>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg bg-[#141B2D] border border-[#1E2638] hover:border-zinc-600 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
              {activeRoleObj.label.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-none">{activeRoleObj.name}</p>
              <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{activeRoleObj.label}</p>
            </div>
            <ChevronDown size={14} className="text-zinc-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#111726] border border-[#232D42] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-[#232D42]">
                <p className="text-xs font-semibold text-white">Switch Role Persona</p>
                <p className="text-[11px] text-zinc-400">Test different access levels and approvals</p>
              </div>
              <div className="py-1">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRoleChange(r.id)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-[#1A2337] transition-colors ${
                      currentRole === r.id ? "bg-amber-500/15 text-amber-400 font-semibold" : "text-zinc-300"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{r.label}</p>
                      <p className="text-[10px] text-zinc-400">{r.name}</p>
                    </div>
                    {currentRole === r.id && <CheckCircle2 size={15} className="text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111726] border border-[#232D42] rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Reset Demo Data?</h3>
                <p className="text-xs text-zinc-400">Restores baseline Hero Scenario</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This will restore all 5 projects, material inventories, and the primary Hero Scenario:
              <strong className="text-white block mt-1">
                Madurai 1,400 kg TMT Shortage vs Chennai 1,500 kg TMT Surplus
              </strong>
            </p>

            {resetSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Demo environment successfully reset! Reloading...</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                disabled={resetting || resetSuccess}
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={resetting || resetSuccess}
                onClick={handleResetDemo}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black transition-colors flex items-center gap-1.5"
              >
                {resetting ? <RotateCcw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                <span>{resetting ? "Resetting..." : "Confirm Reset"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
