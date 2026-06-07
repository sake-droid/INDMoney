/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, ArrowRight, Landmark } from "lucide-react";

interface BannerProps {
  hasClickedBanner: boolean;
  onNavigateToPlanning: () => void;
}

export default function Banner({ hasClickedBanner, onNavigateToPlanning }: BannerProps) {
  if (!hasClickedBanner) {
    return (
      <div className="bg-gradient-to-r from-brand-light to-white border border-brand/20 rounded-2xl p-4 sm:py-3.5 sm:px-6 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 hover:shadow-md">
        {/* Decorative ambient gradient */}
        <div className="absolute top-0 right-0 w-32 h-full bg-brand/5 blur-xl pointer-events-none"></div>

        <div className="flex items-center gap-3.5 text-center sm:text-left relative z-10">
          <div className="w-9 h-9 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 hidden sm:flex">
            <Sparkles className="w-5 h-5 text-brand select-none animate-pulse pointer-events-none" />
          </div>
          <div>
            <h4 className="text-slate-900 text-sm sm:text-base font-bold tracking-tight">
              You are on pace to accumulate <span className="text-brand font-black font-sans">₹1.2 Cr</span> by age <span className="text-brand font-black font-sans">50</span>.
            </h4>
          </div>
        </div>

        <button
          onClick={onNavigateToPlanning}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold font-sans active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-brand/35 shrink-0 z-10"
          id="banner-retirement-cta"
        >
          <span>Plan for retirement</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Once the user clicks & returns, display the small "Financial Planning" CTA card instead.
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Landmark className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h4 className="text-slate-900 text-sm font-bold tracking-tight">Financial planning & goals</h4>
            <p className="text-slate-550 text-slate-500 text-2xs mt-1 font-medium select-none">
              Active life path models running. Analyze shortfalls and project sub-asset growth indexes.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToPlanning}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-brand hover:text-white text-brand border border-slate-200 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
          id="banner-financial-planning-cta"
        >
          <span>Open goals dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
