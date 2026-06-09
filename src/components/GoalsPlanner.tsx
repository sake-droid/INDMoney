/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import * as Icons from "lucide-react";
import { Goal, AssetCategory } from "../types";
import { formatIndianCurrency, calculateMonthlySIP, calculateEMI, calculateSwpCorpusRequired } from "../utils/finance";

interface GoalsPlannerProps {
  goals: Goal[];
  assets: AssetCategory[];
  onSelectCategory: (category: string) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onStartSip: (goal: Goal, recommendedAmount: number) => void;
  mode?: "active" | "templates" | "all";
  userAge?: number;
}

export default function GoalsPlanner({
  goals,
  assets,
  onSelectCategory,
  onEditGoal,
  onDeleteGoal,
  onStartSip,
  mode = "all",
  userAge = 25,
}: GoalsPlannerProps) {
  const [selectedDetailGoal, setSelectedDetailGoal] = React.useState<Goal | null>(null);
  const [isAssetExpanded, setIsAssetExpanded] = React.useState(false);

  const handleOpenDetails = (goal: Goal) => {
    setIsAssetExpanded(false);
    setSelectedDetailGoal(goal);
  };
  
  // Icon picker helper
  const renderIcon = (name: string, colorClass: string = "text-brand") => {
    let Component = Icons.Milestone;
    if (name === "Car") Component = Icons.Car;
    else if (name === "PlaneTakeoff") Component = Icons.Plane;
    else if (name === "Home") Component = Icons.Home;
    else if (name === "Gift") Component = Icons.Gift;
    else if (name === "GraduationCap") Component = Icons.GraduationCap;
    else if (name === "Compass") Component = Icons.Compass;
    else if (name === "Heart") Component = Icons.Heart;
    
    return <Component className={`w-5 h-5 ${colorClass} pointer-events-none`} />;
  };

  // Pre-configured category list dynamically tailored for age
  const categoryCards = userAge <= 50 ? [
    { category: "Buying a car", displayTitle: "Buying Car", icon: "Car" },
    { category: "Planning a trip", displayTitle: "Planning Trip", icon: "PlaneTakeoff" },
    { category: "Buying a house", displayTitle: "Buying House", icon: "Home" },
    { category: "Getting married", displayTitle: "Getting Married", icon: "Gift" },
    { category: "Custom", displayTitle: "Custom Goal", icon: "Milestone" },
  ] : [
    { category: "Child's education", displayTitle: "Child's Education", icon: "GraduationCap" },
    { category: "Pilgrimage", displayTitle: "Pilgrimage", icon: "Compass" },
    { category: "Daughter's marriage", displayTitle: "Daughter's Marriage", icon: "Heart" },
    { category: "Buying a house", displayTitle: "Buying House", icon: "Home" },
    { category: "Custom", displayTitle: "Custom Goal", icon: "Milestone" },
  ];

  const showActive = mode === "all" || mode === "active";
  const showTemplates = mode === "all" || mode === "templates";

  return (
    <div className="space-y-8">
      
      {/* 1. MY GOALS SECTION (Priority 1) - ONLY rendered if there are goals */}
      {showActive && (() => {
        const surplusGoals = goals.filter(g => g.futureValueAllocated > g.targetAmount);
        const deficitGoals = goals.filter(g => g.futureValueAllocated < g.targetAmount);

        return goals.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-slate-900 text-base sm:text-lg font-bold tracking-tight">My Goals</h3>
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

            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-1">
              {goals.map((goal) => {
                return (
                  <div
                    key={goal.id}
                    onClick={() => handleOpenDetails(goal)}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200/90 hover:border-brand/40 hover:shadow-3xs cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 group relative select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center shrink-0 border border-brand/5 group-hover:scale-105 transition-transform duration-200">
                        {renderIcon(goal.iconName, "text-brand w-4.5 h-4.5")}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-slate-900 text-xs font-bold truncate leading-tight group-hover:text-brand transition-colors">
                          {goal.title}
                        </h4>
                        <span className="text-brand text-[11px] font-extrabold font-mono block mt-0.5 leading-none">
                          {formatIndianCurrency(goal.targetAmount)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGoal(goal.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg shrink-0 transition-all cursor-pointer active:scale-95"
                      title="Delete Goal"
                    >
                      <Icons.Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 2. GOAL CATEGORIES SECTION */}
      {showTemplates && (
        <div className="space-y-4">
          <div>
            <h3 className="text-slate-900 text-base sm:text-lg font-bold tracking-tight">Create a New Goal</h3>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5 pt-1">
            {categoryCards.map((card) => {
              return (
                <div
                  key={card.category}
                  onClick={() => onSelectCategory(card.category)}
                  className="bg-white border border-slate-200 hover:border-brand/40 hover:bg-brand-light/10 rounded-2xl p-4 aspect-square w-full cursor-pointer transition-all duration-300 group flex flex-col justify-between items-start shadow-3xs hover:shadow-xs relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-brand-light/30 border border-slate-200 group-hover:border-brand/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 shadow-3xs">
                    {renderIcon(card.icon, "text-slate-400 group-hover:text-brand")}
                  </div>
                  
                  <div className="w-full mt-2">
                    <span className="text-slate-900 text-xs font-bold leading-tight block group-hover:text-brand transition-colors tracking-tight">
                      {card.displayTitle}
                    </span>
                    <span className="text-brand text-[10px] font-bold block mt-1 uppercase tracking-wider">
                      Configure Goal +
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DETAILS MODAL POP-UP FOR INDIVIDUAL GOALS */}
      {selectedDetailGoal && (() => {
        const goal = selectedDetailGoal;
        
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
        const earmarkTarget = goal.downPayment !== undefined ? goal.downPayment : goal.targetAmount;
        const loanAmountVal = goal.loanAmount !== undefined ? goal.loanAmount : 0;
        const progressPercentage = earmarkTarget > 0 ? Math.min(100, (currentCommitted / earmarkTarget) * 100) : 100;
        const isFundSufficient = goal.futureValueAllocated >= earmarkTarget;

        // Calculate specific nominal compounding rate
        let nominalRateVal = 10;
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

        // Find Fund Y name for SWP description
        const emiVal = calculateEMI(loanAmountVal, 8, goal.durationYears);
        const corpusNeededVal = calculateSwpCorpusRequired(emiVal, 12, goal.durationYears);
        let fundYName = "your Mutual Fund holdings";
        
        const selectedSubAssets: any[] = [];
        if (goal.allocations && goal.allocations.length > 0) {
          assets.forEach((cat) => {
            cat.subAssets.forEach((sub) => {
              const matchingAlloc = goal.allocations.find((al) => al.subAssetId === sub.id);
              if (matchingAlloc) {
                selectedSubAssets.push(sub);
              }
            });
          });
        }
        
        const sufficientSubs = selectedSubAssets.filter(item => item.value >= corpusNeededVal);
        if (sufficientSubs.length > 0) {
          sufficientSubs.sort((a, b) => b.value - a.value);
          fundYName = sufficientSubs[0].name;
        } else if (selectedSubAssets.length > 0) {
          const sortedSelected = [...selectedSubAssets].sort((a, b) => b.value - a.value);
          fundYName = sortedSelected[0].name;
        } else {
          let allSubAssets: any[] = [];
          assets.forEach(a => {
            a.subAssets.forEach(sa => {
              allSubAssets.push(sa);
            });
          });
          if (allSubAssets.length > 0) {
            allSubAssets.sort((a, b) => b.value - a.value);
            fundYName = allSubAssets[0].name;
          }
        }

        const selectedSubAssetsWithParent = selectedSubAssets.map(sub => {
          const parent = assets.find(cat => cat.subAssets.some(sa => sa.id === sub.id));
          return {
            name: sub.name,
            value: sub.value,
            parentName: parent ? parent.name : "Portfolio Pool"
          };
        });

        // Determine recommended sub-asset for incremental SIP
        let bestSubAssetRec: any = null;
        if (selectedSubAssets.length > 0) {
          bestSubAssetRec = [...selectedSubAssets].sort((a, b) => b.growthRate - a.growthRate)[0];
        } else {
          let pool: any[] = [];
          assets.forEach(cat => {
            cat.subAssets.forEach(sub => {
              pool.push(sub);
            });
          });
          if (pool.length > 0) {
            bestSubAssetRec = pool.sort((a, b) => b.growthRate - a.growthRate)[0];
          }
        }

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div 
              className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center shrink-0 border border-brand/5 shadow-3xs font-sans">
                    {renderIcon(goal.iconName, "text-brand w-4.5 h-4.5")}
                  </div>
                  <div className="min-w-0 font-sans">
                    <h3 className="text-slate-900 font-extrabold text-sm tracking-tight truncate leading-tight">
                      {goal.title}
                    </h3>
                    <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Goal Details</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedDetailGoal(null)}
                  className="w-7 h-7 rounded-full hover:bg-slate-200/80 hover:text-slate-900 flex items-center justify-center text-slate-400 transition-colors cursor-pointer text-xs font-bold leading-none border border-slate-200"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable details */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1 select-none">
                
                {/* Milestone Box (Target vs. Capital Allocated) */}
                <div className="relative bg-slate-50 border border-slate-200/70 rounded-2xl p-4 sm:p-5 flex justify-between">
                  <div className="space-y-4">
                    {/* Target */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Target Milestone</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                        {formatIndianCurrency(earmarkTarget)}
                      </span>
                    </div>

                    {/* Capital Allocated */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Capital Allocated</span>
                      <span 
                        className="text-sm sm:text-base font-black text-brand font-mono border-b border-dashed border-slate-400 cursor-help inline-block leading-normal"
                        title="This is asset value after the time duration minus inflation."
                      >
                        {formatIndianCurrency(goal.futureValueAllocated)}
                      </span>
                    </div>
                  </div>

                  {/* Top Right Status Pill */}
                  <div className="absolute top-4 right-4">
                    {isFundSufficient ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Icons.CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        On Track
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Icons.AlertCircle className="w-3 h-3 text-rose-500 shrink-0 select-none animate-pulse" />
                        Short of Target
                      </span>
                    )}
                  </div>

                  {/* Bottom Right Horizon */}
                  <div className="absolute bottom-4 right-4 text-[10px] uppercase font-extrabold text-slate-500 font-sans flex items-center gap-1 bg-white border border-slate-200/50 px-2 py-0.5 rounded-lg select-none">
                    <Icons.CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                    Horizon: {goal.durationYears} Yr{goal.durationYears > 1 ? "s" : ""}
                  </div>
                </div>

                {/* Committed Asset with toggle expandable details */}
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setIsAssetExpanded(!isAssetExpanded)}
                    className="w-full flex justify-between items-center px-4 py-3 bg-slate-50 hover:bg-slate-100/50 transition-colors text-left font-sans"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Committed Asset</span>
                      <span className="text-xs font-bold text-slate-700 truncate block max-w-[180px]">
                        {allocationName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-[9px] uppercase font-bold tracking-wider">{isAssetExpanded ? "Collapse" : "Expand"}</span>
                      {isAssetExpanded ? <Icons.ChevronUp className="w-4 h-4" /> : <Icons.ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  
                  {isAssetExpanded && (
                    <div className="px-4 py-1.5 bg-white border-t border-slate-150 divide-y divide-slate-100 max-h-36 overflow-y-auto">
                      {selectedSubAssetsWithParent.length > 0 ? (
                        selectedSubAssetsWithParent.map((item, idx) => (
                           <div key={idx} className="py-2 flex justify-between items-center text-xs">
                             <div className="min-w-0 pr-2">
                               <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                               <span className="text-[9px] text-slate-450 font-semibold uppercase tracking-wider">{item.parentName}</span>
                             </div>
                             <span className="font-bold text-slate-700 shrink-0 font-mono">{formatIndianCurrency(item.value)}</span>
                           </div>
                        ))
                      ) : (
                        <div className="py-2 text-center text-xs font-bold text-slate-400">
                          No explicit allocations selected
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SIP Flow block or Fully Funded feedback */}
                {!isFundSufficient ? (
                  <div className="space-y-1.5">
                    <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-center font-sans">
                      <div className="text-left shrink-0">
                        <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider block">Monthly SIP Needed</span>
                        <span className="text-base font-black text-rose-700 font-mono">
                          {formatIndianCurrency(monthlySIPNeeded)}/mo
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onStartSip(goal, monthlySIPNeeded);
                          setSelectedDetailGoal(null);
                        }}
                        className="w-full sm:w-auto py-2.5 px-4 bg-brand hover:bg-brand-hover text-white text-[11px] font-extrabold uppercase tracking-widest rounded-xl shadow-3xs transition-all active:scale-95 leading-none cursor-pointer"
                      >
                        {goal.activeSipAmount && goal.activeSipAmount > 0 ? "Modify SIP" : "Start SIP"}
                      </button>
                    </div>
                    {bestSubAssetRec && (
                      <div className="text-[10px] font-bold text-slate-500 flex justify-between items-center px-1">
                        <span>Best incremental asset target:</span>
                        <span className="text-brand font-black">{bestSubAssetRec.name} ({bestSubAssetRec.growthRate}% p.a.)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 font-sans text-xs text-emerald-800 font-semibold font-bold">
                    <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Goal covered by current assets! Projected surplus: {formatIndianCurrency(goal.futureValueAllocated - earmarkTarget)}</span>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-between items-center">
                <button
                  onClick={() => {
                    onDeleteGoal(goal.id);
                    setSelectedDetailGoal(null);
                  }}
                  className="py-2 px-3.5 rounded-xl text-3xs font-black uppercase tracking-wider text-rose-600 hover:text-white bg-red-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-600 transition-all cursor-pointer select-none"
                >
                  Delete
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onEditGoal(goal);
                      setSelectedDetailGoal(null);
                    }}
                    className="py-2 px-3.5 rounded-xl text-white bg-brand hover:bg-brand-hover text-3xs font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 select-none"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => setSelectedDetailGoal(null)}
                    className="py-2 px-3 rounded-xl text-slate-500 hover:text-slate-900 bg-white border border-slate-200 text-3xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer select-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
