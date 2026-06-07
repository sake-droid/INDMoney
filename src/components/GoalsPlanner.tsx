/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import * as Icons from "lucide-react";
import { Goal, AssetCategory } from "../types";
import { formatIndianCurrency, calculateMonthlySIP } from "../utils/finance";

interface GoalsPlannerProps {
  goals: Goal[];
  assets: AssetCategory[];
  onSelectCategory: (category: string) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
}

export default function GoalsPlanner({
  goals,
  assets,
  onSelectCategory,
  onEditGoal,
  onDeleteGoal,
}: GoalsPlannerProps) {
  
  // Icon picker helper
  const renderIcon = (name: string, colorClass: string = "text-brand") => {
    let Component = Icons.Milestone;
    if (name === "Car") Component = Icons.Car;
    else if (name === "PlaneTakeoff") Component = Icons.Plane;
    else if (name === "Home") Component = Icons.Home;
    else if (name === "Gift") Component = Icons.Gift;
    
    return <Component className={`w-5 h-5 ${colorClass} pointer-events-none`} />;
  };

  // Pre-configured category list. Just title categories with no initial price amounts
  const categoryCards = [
    { category: "Buying a car", icon: "Car", desc: "Purchase premium mobility options" },
    { category: "Planning a trip", icon: "PlaneTakeoff", desc: "Domestic & global vacation checklists" },
    { category: "Buying a house", icon: "Home", desc: "Real estate investments & mortgage planning" },
    { category: "Getting married", icon: "Gift", desc: "Weddings, banquets, and celebration savings" },
    { category: "Custom", icon: "Milestone", desc: "Bespoke customizable long-term options" },
  ];

  return (
    <div className="space-y-8">
      
      {/* 1. MY GOALS SECTION (Priority 1) - ONLY rendered if there are goals */}
      {(() => {
        const surplusGoals = goals.filter(g => g.futureValueAllocated > g.targetAmount);
        const deficitGoals = goals.filter(g => g.futureValueAllocated < g.targetAmount);

        return goals.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-slate-900 text-lg font-bold tracking-tight">Active life roadmap goals</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Review and audit allocations earmarked from current portfolio holdings.
                </p>
              </div>
              <span className="text-xs bg-brand-light border border-brand/20 text-brand font-extrabold px-3 py-1 rounded-full font-sans">
                {goals.length} earmarked plan{goals.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Smart Portfolio Optimization Recommendations */}
            {surplusGoals.length > 0 && deficitGoals.length > 0 && (
              <div className="bg-brand-light/35 border border-brand/20 rounded-2xl p-4 sm:p-5 flex gap-4 items-start shadow-xs relative overflow-hidden">
                <div className="absolute right-0 top-0 w-12 h-12 bg-brand/5 rounded-bl-full pointer-events-none"></div>
                <div className="p-2 bg-white border border-brand/10 text-brand rounded-xl shrink-0 shadow-3xs">
                  <Icons.Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1.5 min-w-0 flex-1">
                  <h4 className="text-slate-900 text-sm font-bold tracking-tight">
                    Portfolio optimization suggestions
                  </h4>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    We identified that you have overfunded goals alongside goals with funding gaps. To maximize your financial efficiency under inflation adjustments, consider the following rebalancing steps:
                  </p>
                  <div className="pt-2.5 space-y-2 mt-2 border-t border-slate-200/50">
                    {surplusGoals.map((surGoal) => {
                      const surplusVal = surGoal.futureValueAllocated - surGoal.targetAmount;
                      return deficitGoals.map((defGoal) => {
                        const deficitVal = defGoal.shortfall;
                        const transferSugg = Math.min(surplusVal, deficitVal);
                        return (
                          <div key={`${surGoal.id}-${defGoal.id}`} className="text-2xs sm:text-xs text-slate-700 bg-white border border-slate-200/40 p-3 rounded-xl flex items-start gap-2.5 font-medium leading-normal shadow-3xs">
                            <Icons.ArrowRightLeft className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                            <div>
                              Divert surplus from <b className="text-slate-900 font-extrabold">{surGoal.title}</b> to <b className="text-slate-950 font-black">{defGoal.title}</b>: Shifting some of your earmarked assets can satisfy up to <b className="text-brand font-extrabold">{formatIndianCurrency(transferSugg)}</b> of the gap in <b className="text-slate-950 font-bold">{defGoal.title}</b> without affecting the target timeline of <b className="text-slate-900">{surGoal.title}</b>.
                            </div>
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {goals.map((goal) => {
              let allocationName = "";
              if (goal.allocations && goal.allocations.length > 0) {
                const uniqueAssetNames = Array.from(new Set(
                  goal.allocations.map((al) => {
                    const asset = assets.find((a) => a.id === al.assetId);
                    return asset ? asset.name : "";
                  }).filter(Boolean)
                ));

                if (uniqueAssetNames.length === 1) {
                  const firstAlloc = goal.allocations[0];
                  const asset = assets.find((a) => a.id === firstAlloc.assetId);
                  if (asset && goal.allocations.length === asset.subAssets.length) {
                    allocationName = `all ${asset.name.toLowerCase()}`;
                  } else if (goal.allocations.length === 1) {
                    const sub = asset?.subAssets.find((s) => s.id === firstAlloc.subAssetId);
                    allocationName = sub ? `${sub.name}` : `${asset?.name}`;
                  } else {
                    allocationName = `${goal.allocations.length} ${asset?.name.toLowerCase()} funds`;
                  }
                } else {
                  allocationName = uniqueAssetNames.join(" + ");
                }
              } else {
                const matchedAsset = assets.find((a) => a.id === goal.allocatedAssetId);
                const matchedSubAsset = goal.allocatedSubAssetId === "all" 
                  ? null 
                  : matchedAsset?.subAssets.find((sa) => sa.id === goal.allocatedSubAssetId);
                  
                allocationName = matchedSubAsset 
                  ? `${matchedSubAsset.name}` 
                  : `${matchedAsset?.name || "All portfolio"}`;
              }

              const currentCommitted = goal.currentValueAllocated;
              const progressPercentage = Math.min(100, (currentCommitted / goal.targetAmount) * 100);
              const isFundSufficient = goal.futureValueAllocated >= goal.targetAmount;

              // Calculate specific nominal compounding rate for this goal to suggest SIP
              let nominalRateVal = 10; // default rate
              if (goal.allocations && goal.allocations.length > 0) {
                const subAssetsList: { value: number; growthRate: number }[] = [];
                assets.forEach((asset) => {
                  asset.subAssets.forEach((sub) => {
                    if (goal.allocations.some((al) => al.subAssetId === sub.id)) {
                      subAssetsList.push(sub);
                    }
                  });
                });
                const totalVal = subAssetsList.reduce((sum, item) => sum + item.value, 0);
                if (totalVal > 0) {
                  const weightedYield = subAssetsList.reduce((sum, item) => sum + (item.value * item.growthRate), 0);
                  nominalRateVal = weightedYield / totalVal;
                }
              }
              const monthlySIPNeeded = calculateMonthlySIP(goal.shortfall, nominalRateVal, goal.durationYears);

              return (
                <div 
                  key={goal.id} 
                  className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-brand/40 hover:shadow-md shadow-xs transition-all duration-300"
                >
                  {/* Decorative background visual badge */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-all group-hover:scale-110"></div>

                  {/* Title block */}
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-3xs">
                        {renderIcon(goal.iconName, "text-brand")}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-slate-900 text-sm font-extrabold tracking-tight truncate">
                          {goal.title}
                        </h4>
                        <span className="text-slate-500 text-[10.5px] uppercase tracking-wider block font-semibold mt-0.5 truncate">
                          Backing: <span className="text-brand font-bold">{allocationName}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => onEditGoal(goal)}
                        className="px-3 py-1.5 text-3xs rounded-lg bg-slate-50 hover:bg-brand hover:text-white text-slate-700 hover:border-brand font-bold border border-slate-200 cursor-pointer transition-all shadow-3xs active:scale-95 text-center leading-none"
                        title="Edit goal"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="px-3 py-1.5 text-3xs rounded-lg bg-red-50/60 hover:bg-rose-600 hover:text-white border border-rose-100 text-rose-600 font-bold cursor-pointer transition-all shadow-3xs active:scale-95 text-center leading-none"
                        title="Delete goal"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Progressive Milestone gauge bar */}
                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between items-baseline text-3xs font-semibold">
                      <span className="text-slate-400 uppercase tracking-widest">
                        Committed capital base
                      </span>
                      <span className="text-slate-800 font-bold font-sans">
                        {formatIndianCurrency(currentCommitted, true)} of {formatIndianCurrency(goal.targetAmount, true)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative border border-slate-200/40">
                      <div 
                        className="h-full bg-brand rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[11px] font-semibold">
                      <span className="text-slate-500">
                        Cover ratio: <b className="text-brand font-black">{progressPercentage.toFixed(0)}%</b>
                      </span>
                      <span className="text-slate-400 text-3xs uppercase tracking-wider">
                        Horizon: <b className="text-slate-700">{goal.durationYears} years</b>
                      </span>
                    </div>
                  </div>

                  {/* Future Compounding Real Readout */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-3xs uppercase font-bold tracking-wider">Estimated real future value</span>
                      <span className={`text-sm font-extrabold font-sans ${isFundSufficient ? "text-emerald-700" : "text-amber-700"}`}>
                        {formatIndianCurrency(goal.futureValueAllocated)}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 text-right leading-relaxed font-semibold">
                      * Real projection value includes deductible 6.0% inflation index compounding.
                    </p>

                    {!isFundSufficient && (
                      <div className="space-y-2 pt-1 border-t border-slate-200/50">
                        <div className="text-[10.5px] text-rose-600 font-bold flex items-center gap-1.5">
                          <Icons.AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 pointer-events-none" />
                          <span>Deficit gap shortfall: <b>{formatIndianCurrency(goal.shortfall)}</b> required</span>
                        </div>
                        <p className="text-[10.5px] text-slate-700 font-medium leading-relaxed bg-rose-50/50 p-2.5 border border-rose-100/50 rounded-xl">
                          Suggested action: Invest an estimated <b className="text-brand">{formatIndianCurrency(monthlySIPNeeded)} monthly</b> fresh into these earmarked assets to bridge the shortfall by the estimated time.
                        </p>
                      </div>
                    )}
                    {isFundSufficient && (
                      <div className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1.5 pt-1 border-t border-slate-200/50">
                        <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 pointer-events-none" />
                        <span>Plan covered! Expected surplus reserves: <b>{formatIndianCurrency(goal.futureValueAllocated - goal.targetAmount)}</b></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}

      {/* 2. GOAL CATEGORIES SECTION */}
      <div className="space-y-4">
        <div>
          <h3 className="text-slate-900 text-lg font-bold tracking-tight">Earmark new target planning goals</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Select a life path template below to allocate financial portfolio funds and plan target horizons.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {categoryCards.map((card) => {
            return (
              <div
                key={card.category}
                onClick={() => onSelectCategory(card.category)}
                className="bg-white border border-slate-200 hover:border-brand/40 hover:bg-brand-light/20 rounded-2xl p-5 cursor-pointer transition-all duration-300 group flex justify-between items-center shadow-xs hover:shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10.5 h-10.5 rounded-xl bg-slate-50 group-hover:bg-brand-light/40 border border-slate-200 group-hover:border-brand/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 shadow-3xs">
                    {renderIcon(card.icon, "text-slate-400 group-hover:text-brand")}
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-900 text-sm font-bold truncate block group-hover:text-brand transition-colors tracking-tight">
                      {card.category}
                    </span>
                    <span className="text-slate-500 text-3xs block truncate mt-0.5 font-semibold">
                      {card.desc}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200 group-hover:border-brand/20 group-hover:bg-brand group-hover:text-white transition-all shadow-3xs duration-300">
                  <Icons.Plus className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
