/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrendingUp, ArrowUpRight, Award, ShieldCheck } from "lucide-react";
import { formatIndianCurrency } from "../utils/finance";

interface NetWorthCardProps {
  totalValue: number;
  averageGrowth: number;
}

export default function NetWorthCard({ totalValue, averageGrowth }: NetWorthCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Decorative premium corner accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
        <div className="space-y-2">
          {/* Top category label */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-light flex items-center justify-center text-brand">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Consolidated net worth index
            </span>
            <span className="text-[9px] font-bold bg-brand-light border border-brand/20 text-brand px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Live verified
            </span>
          </div>

          {/* Large Main Net Worth Number */}
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-slate-900 text-4xl sm:text-5xl font-black tracking-tight font-sans">
              {formatIndianCurrency(totalValue)}
            </span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full cursor-default select-none shadow-3xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              <span>+0.38%</span>
            </div>
          </div>

          {/* Subtitle feed status */}
          <p className="text-slate-500 text-xs flex items-center gap-2 font-medium">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
            </span>
            Streaming live investment values from synced catalog sources.
          </p>
        </div>

        {/* Detailed KPI sub-boxes */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto shrink-0">
          <div className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200/60 hover:border-brand/25 rounded-xl px-5 py-4 min-w-[150px] transition-all duration-200 group">
            <div className="text-slate-400 text-[9px] font-bold uppercase tracking-widest block mb-1">
              Avg portfolio yield
            </div>
            <div className="text-slate-900 text-xl font-extrabold font-sans leading-none flex items-baseline gap-0.5">
              <span>{averageGrowth.toFixed(2)}%</span>
              <span className="text-slate-450 text-slate-500 text-xs font-semibold">p.a.</span>
            </div>
            <div className="text-brand text-[9px] font-bold mt-1.5 uppercase tracking-wider">
              Beats 6% inflation
            </div>
          </div>

          <div className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200/60 hover:border-brand/25 rounded-xl px-5 py-4 min-w-[150px] transition-all duration-200 group">
            <div className="text-slate-400 text-[9px] font-bold uppercase tracking-widest block mb-1">
              Asset health weight
            </div>
            <div className="text-slate-900 text-xl font-extrabold font-sans leading-none flex items-baseline gap-1">
              <span>98.2</span>
              <span className="text-slate-400 text-xs font-normal">/100</span>
            </div>
            <div className="text-emerald-600 text-[9px] font-bold mt-1.5 uppercase tracking-wider">
              Highly balanced
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
