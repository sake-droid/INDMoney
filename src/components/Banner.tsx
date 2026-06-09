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
      <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4.5 transition-all duration-300 hover:shadow-md hover:scale-[1.002] hover:border-emerald-300/95 group">
        {/* Decorative gentle warm emerald glows */}
        <div className="absolute top-0 right-0 w-48 h-full bg-emerald-200/20 blur-2xl pointer-events-none transition-all duration-300"></div>
        <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-teal-100/35 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0 relative z-10 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-200/50 flex items-center justify-center shrink-0 hidden sm:flex shadow-3xs">
            <Sparkles className="w-5 h-5 text-emerald-650 text-emerald-600 select-none pointer-events-none duration-155 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-left min-w-0">
            <h5 className="text-slate-900 font-extrabold tracking-tight text-sm sm:text-base md:text-lg flex flex-wrap items-center gap-2">
              <span className="text-slate-800">Estimated Net Worth by Age 50:</span>
              <span className="text-emerald-800 font-extrabold font-sans bg-emerald-100/70 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg text-sm sm:text-base shadow-3xs">
                {formatIndianCurrency(nominalWorthAt50)}
              </span>
              <span className="bg-teal-600/10 text-teal-700 border border-teal-200/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider leading-none select-none">
                AI Target Projections
              </span>
            </h5>
            <p className="text-slate-600 text-xs sm:text-sm mt-1.5 font-medium leading-relaxed">
              Is that enough? Map out your specific life milestones to find out
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToPlanning}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-650 bg-emerald-650 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm font-sans transition-all duration-200 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0 z-10 active:scale-95 border border-emerald-700/10 group-hover:px-5.5"
          id="banner-retirement-cta"
        >
          <span>Plan My Goals</span>
          <ArrowRight className="w-4 h-4 text-current stroke-[3] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  // Once the user clicks & returns, display the small "Financial Planning" CTA card instead.
  return (
    <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-4 shadow-3xs transition-all duration-350 relative overflow-hidden group hover:border-emerald-200/85">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/20 rounded-full blur-xl pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8.5 h-8.5 rounded-xl bg-emerald-100/65 border border-emerald-200/40 flex items-center justify-center shrink-0">
            <Landmark className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h5 className="text-slate-800 text-xs sm:text-sm font-extrabold tracking-tight">
              Estimated Net Worth by Age 50: <span className="text-emerald-800 font-extrabold font-sans bg-emerald-100/50 border border-emerald-200/45 px-1.5 py-0.25 rounded">{formatIndianCurrency(nominalWorthAt50)}</span>
            </h5>
            <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 font-medium">
              Is that enough? Map out your specific life milestones to find out
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToPlanning}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs hover:shadow-md active:scale-95 border border-emerald-700/10"
          id="banner-financial-planning-cta"
        >
          <span>Plan My Goals</span>
          <ArrowRight className="w-3.5 h-3.5 text-current" />
        </button>
      </div>
    </div>
  );
}
