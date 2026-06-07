/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Landmark, CalendarDays, ArrowUpRight, ShieldCheck, AlertCircle, Sparkles, HelpCircle } from "lucide-react";
import { AssetCategory } from "../types";
import { formatIndianCurrency, calculateFutureValue, getWeightedAverageGrowth } from "../utils/finance";

interface RetirementPlannerProps {
  assets: AssetCategory[];
  currentAge: number;
}

export default function RetirementPlanner({ assets, currentAge }: RetirementPlannerProps) {
  const [retirementAge, setRetirementAge] = useState(60);
  const [targetCorpus, setTargetCorpus] = useState(100000000); // 10 Cr default

  // Calculate parameters according to literal user feedback
  // "In case the logged in user's age is 25, we will show him 'Years left' which will be 45 in this case"
  const yearsLeftInput = currentAge === 25 ? 45 : Math.max(0, retirementAge - currentAge);

  const totalCurrentCapital = assets.reduce((sum, a) => sum + a.totalValue, 0);
  const weightedRate = getWeightedAverageGrowth(assets);

  // Future value at retirement age with real growth (weightedRate - 6% inflation)
  const realFutureValue = calculateFutureValue(
    totalCurrentCapital,
    weightedRate,
    yearsLeftInput,
    true // Subtract 6% inflation
  );

  const shortfall = Math.max(0, targetCorpus - realFutureValue);
  const isSufficient = realFutureValue >= targetCorpus;
  const coveragePercent = Math.min(100, (realFutureValue / targetCorpus) * 100);

  return (
    <div className="space-y-6">
      {/* Intro Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-105"></div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-brand" />
            <span>Desired target corpus</span>
          </div>
          <div className="text-slate-900 text-2xl font-black font-sans leading-none relative z-10">
            {formatIndianCurrency(targetCorpus)}
          </div>
          <div className="text-[10px] text-slate-500 mt-2.5 font-semibold">
            Adjust target milestones dynamically below.
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-105"></div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            <span>Retirement horizon</span>
          </div>
          <div className="text-slate-900 text-2xl font-black font-sans leading-none flex items-baseline gap-1 relative z-10">
            <span>{yearsLeftInput} Years</span>
            <span className="text-slate-400 text-xs font-semibold ml-1">left</span>
          </div>
          <div className="text-[10px] text-brand mt-2.5 font-bold uppercase tracking-wider">
            Based on current age {currentAge}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-105"></div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>Compounding index yield</span>
          </div>
          <div className="text-slate-900 text-2xl font-black font-sans leading-none relative z-10">
            {weightedRate.toFixed(2)}% <span className="text-slate-400 text-xs font-medium">p.a.</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-2.5 font-bold uppercase tracking-wider">
            Capital-weighted portfolio rate
          </div>
        </div>
      </div>

      {/* Interactive slider adjustments */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-slate-900 text-sm font-bold tracking-tight">
            Configure accumulation assumptions
          </h3>
          <p className="text-slate-500 text-3xs font-medium mt-0.5">
            Slide the markers under strict Indian inflation adjustments to test target capital structures.
          </p>
        </div>

        <div className="space-y-6">
          {/* Target Amount adjustment slider */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-baseline">
              <label className="text-slate-500 text-xs font-bold">Desired corpus target</label>
              <span className="text-brand font-black text-sm bg-brand-light px-2.5 py-1 rounded-lg border border-brand/10">
                {formatIndianCurrency(targetCorpus)}
              </span>
            </div>
            <input
              type="range"
              min={20000000} // 2 Cr
              max={250000000} // 25 Cr
              step={5000000} // 50 L
              value={targetCorpus}
              onChange={(e) => setTargetCorpus(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 accent-brand rounded-lg cursor-pointer transition-all hover:bg-slate-200"
            />
            <div className="flex justify-between text-slate-400 text-[9.5px] font-bold">
              <span>₹2 Cr</span>
              <span>₹10 Cr (recommended)</span>
              <span>₹18 Cr</span>
              <span>₹25 Cr</span>
            </div>
          </div>

          {/* Age adjustment slider */}
          <div className="space-y-2.5 pt-2">
            <div className="flex justify-between items-baseline">
              <label className="text-slate-500 text-xs font-bold">Target retirement age</label>
              <span className="text-brand font-black text-sm bg-brand-light px-2.5 py-1 rounded-lg border border-brand/10">
                Age {retirementAge} <span className="text-xs text-slate-450 font-semibold">({yearsLeftInput} working years)</span>
              </span>
            </div>
            <input
              type="range"
              min={45}
              max={75}
              step={1}
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 accent-brand rounded-lg cursor-pointer transition-all hover:bg-slate-200"
            />
            <div className="flex justify-between text-slate-400 text-[9.5px] font-bold">
              <span>Age 45</span>
              <span>Age 60 (standard guidelines)</span>
              <span>Age 75</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main shortfall status card */}
      <div className={`p-6 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all duration-300 shadow-sm ${
        isSufficient 
          ? "bg-emerald-50/65 border-emerald-200/90" 
          : "bg-rose-50/65 border-rose-200/90"
      }`}>
        <div className="space-y-2.5 max-w-xl">
          <div className="flex items-center gap-2">
            {isSufficient ? (
              <div className="px-2.5 py-1 bg-emerald-100 border border-emerald-250 text-emerald-800 rounded-full text-2xs font-extrabold font-sans uppercase tracking-wider shadow-3xs">
                ✓ On track
              </div>
            ) : (
              <div className="px-2.5 py-1 bg-rose-100 border border-rose-250 text-rose-800 rounded-full text-2xs font-extrabold font-sans uppercase tracking-wider shadow-3xs animate-pulse">
                ⚠️ Deficit shortfall
              </div>
            )}
            <span className="text-slate-500 text-xs font-bold">Retirement sufficiency status</span>
          </div>

          <p className="text-slate-900 text-sm font-bold leading-relaxed">
            {isSufficient 
              ? `Outstanding! Your consolidated active portfolios will compound to an inflation-adjusted real value of ${formatIndianCurrency(realFutureValue)}, fully safeguarding the ${formatIndianCurrency(targetCorpus)} milestone target.`
              : `With your current investable reserves, your active assets will compound to an estimated real value of ${formatIndianCurrency(realFutureValue)} over ${yearsLeftInput} working years. You currently face a shortfall from your goal.`
            }
          </p>

          <p className="text-slate-550 text-slate-500 text-xs leading-relaxed font-semibold">
            Calculation models 100% reallocation of your current <span className="text-slate-900 font-bold">{formatIndianCurrency(totalCurrentCapital)}</span> portfolio capital towards retirement. Trajectory yield accumulates at a real rate of <span className="text-slate-900 font-bold">{(weightedRate - 6).toFixed(2)}%</span> p.a., which subtracts <span className="text-slate-900 font-bold">6.0% annual inflation benchmarks</span> continuously to reflect pure tomorrow-adjusted buying power.
          </p>
        </div>

        <div className="w-full lg:w-auto p-5 bg-white rounded-xl border border-slate-200/80 min-w-[240px] text-left space-y-4 shrink-0 shadow-3xs">
          <div>
            <span className="text-slate-440 text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
              Estimated net shortfall
            </span>
            <span className={`text-2xl font-black font-sans block leading-none ${isSufficient ? "text-emerald-700" : "text-rose-700"}`}>
              {isSufficient ? "₹0 (fully covered)" : formatIndianCurrency(shortfall)}
            </span>
          </div>

          <div className="border-t border-slate-200/80 pt-3.5">
            <span className="text-slate-440 text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
              Accumulated asset cover
            </span>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-1.5 border border-slate-150">
              <div 
                className={`h-full transition-all duration-500 ${isSufficient ? "bg-emerald-600" : "bg-rose-500"}`}
                style={{ width: `${coveragePercent}%` }}
              ></div>
            </div>
            <span className="text-slate-500 text-3xs uppercase tracking-wider font-extrabold flex items-center gap-1.5">
              <span>{coveragePercent.toFixed(1)}% funded</span>
              <span className="text-slate-300">•</span>
              <span className={isSufficient ? "text-emerald-600" : "text-rose-600"}>
                {isSufficient ? "Surplus Reserves" : "Gap Deficit"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
