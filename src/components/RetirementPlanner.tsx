/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { TrendingUp, CalendarDays, ShieldCheck, Heart, Info } from "lucide-react";
import { AssetCategory, UserProfile } from "../types";
import { formatIndianCurrency, getWeightedAverageGrowth, calculateMonthlySIP } from "../utils/finance";

interface RetirementPlannerProps {
  assets: AssetCategory[];
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

export default function RetirementPlanner({ assets, profile, onUpdateProfile }: RetirementPlannerProps) {
  const currentAge = profile.currentAge;
  const retirementAge = profile.retirementAge;
  const currentExpenses = profile.monthlyExpenses ?? 50000;

  const totalCurrentCapital = assets.reduce((sum, a) => sum + a.totalValue, 0);
  const weightedRate = getWeightedAverageGrowth(assets);

  // Years left to retire
  const yearsLeft = Math.max(1, retirementAge - currentAge);

  // Inflation calculations: Living (90% influenced by 6% inflation), Medical (10% influenced by 10% inflation)
  const generalPortion = currentExpenses * 0.90;
  const medicalPortion = currentExpenses * 0.10;

  const generalInflated = generalPortion * Math.pow(1.06, yearsLeft);
  const medicalInflated = medicalPortion * Math.pow(1.10, yearsLeft);
  const combinedMonthlyRetired = generalInflated + medicalInflated;
  
  // Calculate necessary corpus: 20x annual post-retirement expenses
  const calculatedCorpus = Math.round(combinedMonthlyRetired * 12 * 20);

  // Sync profile when inputs change helper
  const handleExpensesChange = (expenses: number) => {
    const yLeft = Math.max(1, retirementAge - currentAge);
    const gen = expenses * 0.90 * Math.pow(1.06, yLeft);
    const med = expenses * 0.10 * Math.pow(1.10, yLeft);
    const monthly = gen + med;
    const corpus = Math.round(monthly * 12 * 20);

    onUpdateProfile({
      ...profile,
      monthlyExpenses: expenses,
      targetRetirementCorpus: corpus,
    });
  };

  const handleRetirementAgeChange = (retAge: number) => {
    const yLeft = Math.max(1, retAge - currentAge);
    const gen = currentExpenses * 0.90 * Math.pow(1.06, yLeft);
    const med = currentExpenses * 0.10 * Math.pow(1.10, yLeft);
    const monthly = gen + med;
    const corpus = Math.round(monthly * 12 * 20);

    onUpdateProfile({
      ...profile,
      retirementAge: retAge,
      targetRetirementCorpus: corpus,
    });
  };

  // Compounding of current active assets under real rate of return (weightedRate - 6% inflation)
  const realMultiplier = Math.pow(1 + Math.max(0, (weightedRate / 100) - 0.06), yearsLeft);
  const projectedAssetsReal = totalCurrentCapital * realMultiplier;

  const isSufficient = projectedAssetsReal >= calculatedCorpus;
  const shortfall = Math.max(0, calculatedCorpus - projectedAssetsReal);
  const coveragePercent = Math.min(100, (projectedAssetsReal / calculatedCorpus) * 100);

  // Find sub-asset or asset with highest growth rate for recommendation
  let bestRecommendationName = "Mutual Funds";
  let maxRate = 0;
  
  assets.forEach(cat => {
    if (cat.averageGrowthRate > maxRate) {
      maxRate = cat.averageGrowthRate;
      bestRecommendationName = cat.name;
    }
    cat.subAssets.forEach(sub => {
      if (sub.growthRate > maxRate) {
        maxRate = sub.growthRate;
        bestRecommendationName = sub.name;
      }
    });
  });

  const incrementalSip = shortfall > 0 ? calculateMonthlySIP(shortfall, weightedRate, yearsLeft) : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Assumptions Configuration Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Assumptions Configuration</span>
          <span className="text-[10px] text-slate-400 font-semibold italic flex items-center gap-1 text-slate-400 bg-slate-50 border border-slate-200/30 px-2 py-0.5 rounded">
            <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            General Inflation: 6% | Medical Inflation: 10%
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Expenses Slider / Input */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-baseline">
              <label className="text-slate-700 text-xs font-bold font-sans">Monthly Expenses Today</label>
              <div className="flex items-center bg-brand-light border border-brand/15 rounded-lg px-2.5 py-0.5">
                <span className="text-[11px] text-brand font-black font-sans shrink-0 mr-0.5">₹</span>
                <input
                  type="number"
                  value={currentExpenses}
                  onChange={(e) => handleExpensesChange(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 bg-transparent text-brand text-[11px] font-black outline-none font-mono text-right"
                />
              </div>
            </div>
            
            <input
              type="range"
              min={10000}
              max={1000000}
              step={5000}
              value={currentExpenses}
              onChange={(e) => handleExpensesChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 accent-brand rounded-lg cursor-pointer transition-all hover:bg-slate-200"
            />
            
            <div className="flex justify-between text-slate-400 text-[9px] font-bold font-sans">
              <span>₹10K</span>
              <span>₹2.5L</span>
              <span>₹5L</span>
              <span>₹10L</span>
            </div>
          </div>

          {/* Retirement Age Slider / Label */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-baseline">
              <label className="text-slate-700 text-xs font-bold font-sans">Retirement Target Age</label>
              <span className="text-brand font-black text-[11px] bg-brand-light px-2.5 py-1 rounded-lg border border-brand/15 font-sans">
                Age {retirementAge}
              </span>
            </div>
            
            <input
              type="range"
              min={Math.max(35, currentAge + 1)}
              max={75}
              step={1}
              value={retirementAge}
              onChange={(e) => handleRetirementAgeChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 accent-brand rounded-lg cursor-pointer transition-all hover:bg-slate-200"
            />
            
            <div className="flex justify-between text-slate-400 text-[9px] font-bold font-sans">
              <span>Age {Math.max(35, currentAge + 1)}</span>
              <span>Age 60</span>
              <span>Age 75</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Result Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden font-sans">
        
        {/* Core Calculated Corpus output */}
        <div className="md:col-span-2 space-y-3 md:border-r border-slate-100 pr-0 md:pr-6 flex flex-col justify-center">
          <div>
            <span className="text-[10px] text-brand font-extrabold uppercase tracking-wider block">Recommended Retirement Corpus</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight leading-tight">
              {formatIndianCurrency(calculatedCorpus)}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1 bg-slate-50 border border-slate-200/50 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              Living: {formatIndianCurrency(Math.round(generalInflated))}/mo (6%)
            </span>
            <span className="flex items-center gap-1 bg-slate-50 border border-slate-200/50 px-2 py-1 rounded-lg">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Medical: {formatIndianCurrency(Math.round(medicalInflated))}/mo (10%)
            </span>
          </div>
        </div>

        {/* Supporting Compact Timeline Metrics */}
        <div className="flex flex-col justify-center divide-y divide-slate-100">
          <div className="flex justify-between items-center py-2 text-xs">
            <span className="text-[10px] text-slate-450 text-slate-400 font-bold uppercase">Working Years Remaining</span>
            <span className="font-extrabold text-slate-800 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              {yearsLeft} Years
            </span>
          </div>
          <div className="flex justify-between items-center py-2 text-xs">
            <span className="text-[10px] text-slate-450 text-slate-400 font-bold uppercase">Portfolio Yield (Weighted)</span>
            <span className="font-extrabold text-emerald-600">{weightedRate.toFixed(1)}% p.a.</span>
          </div>
          <div className="flex justify-between items-center py-2 text-xs">
            <span className="text-[10px] text-slate-450 text-slate-400 font-bold uppercase">Combined Inflated Cost</span>
            <span className="font-extrabold text-amber-600 font-mono">{formatIndianCurrency(Math.round(combinedMonthlyRetired))}/mo</span>
          </div>
        </div>
      </div>

      {/* Sufficiency Status and Gap Progress */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-5 transition-all shadow-xs ${
        isSufficient 
          ? "bg-emerald-50/40 border-emerald-150" 
          : "bg-rose-50/30 border-rose-150"
      }`}>
        <div className="space-y-1 sm:space-y-2 flex-1 leading-normal">
          <div className="flex items-center gap-1.5 font-sans">
            {isSufficient ? (
              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Fully Covered
              </span>
            ) : (
              <span className="bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 animate-pulse">
                Shortfall Deficit
              </span>
            )}
            <span className="text-slate-450 text-slate-400 font-bold text-[10px] uppercase tracking-wider">Sufficiency Status</span>
          </div>
          <p className="text-slate-800 text-xs font-semibold leading-relaxed font-sans">
            {isSufficient
              ? `Your active portfolios will compound to an estimated real value of ${formatIndianCurrency(Math.round(projectedAssetsReal))} (inflation subtracted), fully safeguarding your determined retirement corpus limit.`
              : `Your assets compound to a real value of ${formatIndianCurrency(Math.round(projectedAssetsReal))}, leaving a shortfall deficit of ${formatIndianCurrency(shortfall)} from target.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 min-w-[210px] flex-1 space-y-2 shadow-3xs font-sans text-left">
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Portfolio Coverage Match</span>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1 mb-1 border border-slate-150 relative">
                <div 
                  className={`h-full transition-all duration-500 ${isSufficient ? "bg-emerald-500" : "bg-rose-500"}`}
                  style={{ width: `${coveragePercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-baseline text-[9px] font-black uppercase text-slate-450">
                <span className="text-slate-500">{coveragePercent.toFixed(1)}% Funded</span>
                <span className={isSufficient ? "text-emerald-600" : "text-rose-600 font-bold"}>
                  {isSufficient ? "On Track" : gapDescription(shortfall)}
                </span>
              </div>
            </div>
          </div>

          {!isSufficient && incrementalSip > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 min-w-[210px] flex-1 space-y-1.5 shadow-3xs font-sans text-left">
              <div>
                <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-widest block">Incremental SIP Needed</span>
                <div className="text-sm font-black text-rose-700 font-mono mt-0.5 leading-normal">
                  {formatIndianCurrency(Math.ceil(incrementalSip))}/mo
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center pt-0.5">
                  <span>Target Asset:</span>
                  <span className="text-brand font-black max-w-[110px] truncate" title={bestRecommendationName}>
                    {bestRecommendationName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );

  function gapDescription(gap: number) {
    if (gap > 10000000) return "High Gap";
    if (gap > 5000000) return "Medium Gap";
    return "Low Gap";
  }
}
