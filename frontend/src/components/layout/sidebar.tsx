"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Boxes,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  GitCompare,
  Bot,
  CheckSquare,
  BarChart3,
  Bell,
  History,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: Building2 },
  { label: "Materials Master", href: "/materials", icon: Boxes },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Procurement", href: "/procurement", icon: ShoppingCart },
  { label: "Forecasting", href: "/forecast", icon: TrendingUp },
  { label: "Shortage Alerts", href: "/shortages", icon: AlertTriangle, badge: "1" },
  { label: "Surplus Opportunities", href: "/surplus", icon: Sparkles },
  { label: "Cross-Project Matching", href: "/optimization", icon: GitCompare },
  { label: "AI Operations Agent", href: "/agent", icon: Bot, isHighlight: true },
  { label: "Approval Center", href: "/approvals", icon: CheckSquare, badge: "1" },
  { label: "Analytics & ROI", href: "/analytics", icon: BarChart3 },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Audit Logs", href: "/audit-log", icon: History },
  { label: "CSV Import", href: "/data-import", icon: FileSpreadsheet },
  { label: "Settings & Policies", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-[#0E131F] border-r border-[#1E2638] flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E2638]">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-lg shadow-sm">
              CQ
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Construct<span className="text-amber-400">IQ</span>
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
                Resource Agent
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-lg">
              CQ
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-[#1A2234] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold"
                  : item.isHighlight
                  ? "text-amber-300 hover:bg-amber-500/10 border border-amber-500/20"
                  : "text-zinc-300 hover:text-white hover:bg-[#161F32]"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} className={isActive ? "text-amber-400" : item.isHighlight ? "text-amber-400" : "text-zinc-400"} />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#1E2638] bg-[#0A0E18]">
        {!collapsed ? (
          <div className="flex items-center justify-between text-xs text-zinc-400 px-2 py-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Engine Online</span>
            </div>
            <span className="text-[10px] text-zinc-400 border border-zinc-700/60 px-1.5 py-0.5 rounded bg-zinc-800/60">
              v1.0.0
            </span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="AI Engine Online" />
          </div>
        )}
      </div>
    </aside>
  );
}
