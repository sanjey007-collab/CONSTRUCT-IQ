"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Key,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  Lock
} from "lucide-react";
import { apiFetch, setAuthToken, setCurrentUserRole } from "@/lib/api";

const DEMO_PERSONAS = [
  { role: "PROCUREMENT_MANAGER", name: "Priya Ramakrishnan", email: "procurement@constructiq.com", title: "Procurement Manager", desc: "Material forecasting & vendor comparison" },
  { role: "PROJECT_MANAGER", name: "Karthik Venkatesh", email: "pm@constructiq.com", title: "Project Manager", desc: "Site schedules & shortage resolution" },
  { role: "ADMIN", name: "Aravind Swaminathan", email: "admin@constructiq.com", title: "Company Admin", desc: "Full executive control & policy rules" },
  { role: "SITE_ENGINEER", name: "Muthu Kumar", email: "site@constructiq.com", title: "Site Engineer", desc: "Field yard stock & consumption" },
  { role: "FINANCE_MANAGER", name: "Deepa Sundaram", email: "finance@constructiq.com", title: "Finance Director", desc: "Audit logs & spend analytics" },
  { role: "VIEWER", name: "Rahul Sharma", email: "viewer@constructiq.com", title: "Auditor / Viewer", desc: "Read-only compliance reporting" }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("procurement@constructiq.com");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    const targetEmail = customEmail || email;

    try {
      const res = await apiFetch<{ access_token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail, password }),
      });
      setAuthToken(res.access_token);
      setCurrentUserRole(res.user.role);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const selectPersona = (persona: typeof DEMO_PERSONAS[0]) => {
    setEmail(persona.email);
    handleLogin(undefined, persona.email);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-4xl mx-auto space-y-8">
      {/* Brand & Introduction */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Sparkles size={14} />
          <span>Construction Operations Intelligence Prototype</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Sign In to <span className="text-amber-400">ConstructIQ</span>
        </h1>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          AI-powered construction resource operations agent predicting material imbalances and orchestrating cross-site redistribution.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs text-center max-w-md mx-auto">
          {error}
        </div>
      )}

      {/* 1-Click Quick Demo Persona Grid */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-zinc-400 text-center uppercase tracking-wider font-mono">
          One-Click Instant Role Personas (Demo Mode)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {DEMO_PERSONAS.map((p) => (
            <button
              key={p.role}
              onClick={() => selectPersona(p)}
              className="p-4 rounded-xl bg-[#111726] border border-[#1E2638] hover:border-amber-500/50 hover:bg-[#151D30] text-left transition-all group space-y-1.5 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors font-mono">
                  {p.role}
                </span>
                <ArrowRight size={13} className="text-zinc-600 group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-sm text-white">{p.name}</p>
              <p className="text-[11px] text-zinc-400">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Standard Form */}
      <div className="max-w-md mx-auto w-full p-6 rounded-xl bg-[#111726] border border-[#1E2638] shadow-xl space-y-4">
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Mail size={13} className="text-zinc-400" />
              Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#141B2D] border border-[#1E2638] text-white focus:outline-none focus:border-amber-500/60"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Key size={13} className="text-zinc-400" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#141B2D] border border-[#1E2638] text-white focus:outline-none focus:border-amber-500/60"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In to Workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
