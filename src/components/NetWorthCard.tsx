/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrendingUp, ArrowUpRight, Award, ShieldCheck } from "lucide-react";
import { formatIndianCurrency } from "../utils/finance";
import { AssetCategory } from "../types";

interface NetWorthCardProps {
  totalValue: number;
  averageGrowth: number;
  assets?: AssetCategory[];
}

export default function NetWorthCard({ totalValue, averageGrowth, assets }: NetWorthCardProps) {
  // Find top performing asset category dynamically
  const topAsset = assets && assets.length > 0
    ? [...assets].reduce((prev, current) => (prev.averageGrowthRate > current.averageGrowthRate) ? prev : current)
    : { name: "Stocks", averageGrowthRate: 14.5 };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:py-3 sm:px-5 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Decorative premium corner accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 relative z-10">
        <div className="space-y-1">
          {/* Top category label - highlighted and only mentioning Net Worth */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black tracking-wider text-brand uppercase bg-brand-light border border-brand/20 px-2 py-0.5 rounded-md">
              Net Worth
            </span>
          </div>

          {/* Large Main Net Worth Number */}
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-slate-900 text-3xl sm:text-4xl font-black tracking-tight font-sans">
              {formatIndianCurrency(totalValue)}
            </span>
            <div className="flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full cursor-default select-none shadow-3xs">
              <span className="w-1.2 h-1.2 rounded-full bg-emerald-500 animate-ping"></span>
              <ArrowUpRight className="w-3 h-3 shrink-0" />
              <span>+0.38%</span>
            </div>
          </div>

          {/* Subtext */}
          <p className="text-slate-500 text-[11px] font-semibold">
            Tracking aggregate growth across 7 core asset classes in real-time
          </p>
        </div>

        {/* Detailed KPI sub-boxes on the right */}
        <div className="flex flex-row items-center gap-3 shrink-0 self-start lg:self-center">
          <div className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200/60 hover:border-brand/25 rounded-xl px-3.5 py-1.5 pb-2 min-w-[135px] transition-all duration-200 group">
            <div className="text-slate-400 text-[8px] font-bold uppercase tracking-widest block mb-0.5">
              Avg portfolio yield
            </div>
            <div className="text-slate-900 text-base font-extrabold font-sans leading-none flex items-baseline gap-0.5">
              <span>{averageGrowth.toFixed(2)}%</span>
              <span className="text-slate-500 text-[10px] font-semibold">p.a.</span>
            </div>
            <div className="text-brand text-[8px] font-bold mt-1 uppercase tracking-wider">
              Beats 6% inflation
            </div>
          </div>

          <div className="bg-slate-50/60 hover:bg-slate-50 border border-slate-200/60 hover:border-brand/25 rounded-xl px-3.5 py-1.5 pb-2 min-w-[135px] transition-all duration-200 group">
            <div className="text-slate-400 text-[8px] font-bold uppercase tracking-widest block mb-0.5">
              Top performing asset
            </div>
            <div className="text-slate-900 text-base font-extrabold font-sans leading-none truncate max-w-[125px]">
              {topAsset.name}
            </div>
            <div className="text-emerald-600 text-[8px] font-bold mt-1 uppercase tracking-wider">
              ~{topAsset.averageGrowthRate.toFixed(1)}% yield
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
