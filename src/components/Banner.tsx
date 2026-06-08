/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, ArrowRight, Landmark } from "lucide-react";
import { formatIndianCurrency } from "../utils/finance";

interface BannerProps {
  hasClickedBanner: boolean;
  onNavigateToPlanning: () => void;
  nominalWorthAt50: number;
  realWorthAt50: number;
  targetAge: number;
}

export default function Banner({ 
  hasClickedBanner, 
  onNavigateToPlanning, 
  nominalWorthAt50, 
  realWorthAt50, 
  targetAge 
}: BannerProps) {
  if (!hasClickedBanner) {
    return (
      <div className="bg-gradient-to-r from-brand via-indigo-600 to-violet-700 border border-brand/45 rounded-2xl p-4 sm:py-3.5 sm:px-6 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.003]">
        {/* Decorative ambient glow */}
        <div className="absolute top-0 right-0 w-32 h-full bg-white/5 blur-xl pointer-events-none"></div>

        <div className="flex items-center gap-3.5 text-center sm:text-left relative z-10">
          <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0 hidden sm:flex">
            <Sparkles className="w-5 h-5 text-yellow-300 select-none animate-pulse pointer-events-none" />
          </div>
          <div className="text-left">
            <h4 className="text-yellow-300 text-xs font-black tracking-wider uppercase flex items-center gap-2">
              <span>Financial Planning & Goals</span>
              <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest leading-none">AI Projection</span>
            </h4>
            <p className="text-white text-[11px] sm:text-xs mt-1.5 leading-relaxed font-semibold">
              Your estimated net worth by age 50 is expected to reach <span className="text-yellow-300 font-extrabold font-sans bg-white/10 px-1.5 py-0.25 rounded">{formatIndianCurrency(nominalWorthAt50)}</span> (or <span className="text-cyan-200 font-extrabold">{formatIndianCurrency(realWorthAt50)}</span> in real purchasing power after 6% inflation).
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToPlanning}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-350 active:scale-95 text-slate-950 text-xs font-black font-sans transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-yellow-300 shrink-0 z-10"
          id="banner-retirement-cta"
        >
          <span>Plan My Goals</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
        </button>
      </div>
    );
  }

  // Once the user clicks & returns, display the small "Financial Planning" CTA card instead.
  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      {/* Decorative ambient light flare */}
      <div className="absolute top-0 right-0 w-32 h-full bg-brand/20 blur-xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Landmark className="w-5 h-5 text-brand-light" />
          </div>
          <div>
            <h4 className="text-white text-sm font-extrabold tracking-tight uppercase">Financial Planning & Goals</h4>
            <p className="text-slate-300 text-xs mt-1 font-semibold leading-relaxed">
              Your estimated net worth by age 50 is projected to reach <span className="text-yellow-300 font-extrabold font-sans">{formatIndianCurrency(nominalWorthAt50)}</span> under active compounding trends.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToPlanning}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-brand text-white border border-white/15 text-xs font-semibold hover:border-brand transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
          id="banner-financial-planning-cta"
        >
          <span>Plan My Goals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
