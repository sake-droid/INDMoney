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
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
      {/* Decorative premium corner accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="space-y-4">
          {/* Top category label - highlighted */}
          <div>
            <span className="text-[11px] font-black tracking-widest text-[#00b0ff] uppercase bg-[#00b0ff]/5 border border-[#00b0ff]/15 px-3 py-1 rounded-lg">
              Net Worth
            </span>
          </div>

          {/* Large Main Net Worth Number with growth badge beside it */}
          <div className="space-y-2">
            <div className="flex flex-row flex-wrap items-center gap-3 sm:gap-4">
              <h1 className="text-slate-900 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight font-sans leading-none">
                {formatIndianCurrency(totalValue)}
              </h1>
              <div className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-[11px] sm:text-xs bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full cursor-default select-none shadow-3xs self-center">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 stroke-[3]" />
                <span>+0.38% today</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-xl leading-relaxed">
              Tracking aggregate growth across 7 core asset classes in real-time.
            </p>
          </div>
        </div>

        {/* Detailed KPI sub-boxes aligned on the right end */}
        <div className="flex flex-row flex-wrap items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
          <div className="bg-slate-50 border-2 border-slate-100 hover:border-[#00b0ff]/30 rounded-2xl px-5 py-3.5 min-w-[155px] flex-1 sm:flex-initial transition-all duration-200 group">
            <div className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest block mb-1">
              Avg Portfolio Yield
            </div>
            <div className="text-slate-900 text-lg sm:text-xl font-extrabold font-sans leading-none flex items-baseline gap-0.5">
              <span>{averageGrowth.toFixed(2)}%</span>
              <span className="text-slate-500 text-[11px] font-semibold">p.a.</span>
            </div>
            <div className="text-brand text-[9px] font-black mt-1 uppercase tracking-wider">
              Beats 6% inflation
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-100 hover:border-[#00b0ff]/30 rounded-2xl px-5 py-3.5 min-w-[155px] flex-1 sm:flex-initial transition-all duration-200 group">
            <div className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest block mb-1">
              Top Asset Class
            </div>
            <div className="text-slate-900 text-lg sm:text-xl font-extrabold font-sans leading-none truncate max-w-[140px]">
              {topAsset.name}
            </div>
            <div className="text-emerald-600 text-[9px] font-black mt-1 uppercase tracking-wider">
              ~{topAsset.averageGrowthRate.toFixed(1)}% yield
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
