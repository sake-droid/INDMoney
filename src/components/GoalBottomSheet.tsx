/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Sliders, Coins, ShieldCheck, AlertCircle, Sparkles, ChevronDown, ChevronUp, Landmark, FileSpreadsheet, ArrowRightLeft } from "lucide-react";
import { AssetCategory, Goal, SubAsset } from "../types";
import { formatIndianCurrency, calculateFutureValue, calculateMonthlySIP, calculateEMI, calculateSwpCorpusRequired } from "../utils/finance";

interface GoalBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  assets: AssetCategory[];
  onSaveGoal: (goal: Goal) => void;
  editingGoal?: Goal; // If we edit or adjust on "My Goals"
  goals: Goal[];
}

export default function GoalBottomSheet({
  isOpen,
  onClose,
  category,
  assets: rawAssets,
  onSaveGoal,
  editingGoal,
  goals,
}: GoalBottomSheetProps) {
  const assets = rawAssets.filter(a => a.id !== "nps" && a.id !== "ppf" && a.id !== "esops" && a.id !== "real_estate");
  // Find which other goal owns a sub asset
  const getSubAssetOwnerGoal = (subId: string): Goal | undefined => {
    return goals.find(g => g.id !== editingGoal?.id && g.allocations && g.allocations.some(a => a.subAssetId === subId));
  };

  // Pre-populated defaults based on category
  const getDefaultValues = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "buying a car":
        return { amount: 1500000, years: 4, assetId: "mutual_funds", subAssetId: "all" };
      case "planning a trip":
        return { amount: 300000, years: 2, assetId: "crypto", subAssetId: "all" };
      case "buying a house":
        return { amount: 8000000, years: 10, assetId: "stocks", subAssetId: "all" };
      case "getting married":
        return { amount: 1200000, years: 3, assetId: "mutual_funds", subAssetId: "all" };
      default:
        return { amount: 500000, years: 5, assetId: "mutual_funds", subAssetId: "all" };
    }
  };

  const defaults = getDefaultValues(category);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState(defaults.amount);
  const [durationYears, setDurationYears] = useState(defaults.years);
  const [downPayment, setDownPayment] = useState(defaults.amount);
  const [loanAmount, setLoanAmount] = useState(0);
  
  // Array of earmarked sub-asset IDs
  const [selectedSubAssetIds, setSelectedSubAssetIds] = useState<string[]>([]);
  
  // Array of asset categories that are expanded (open) within the bottom sheet checklist.
  // Initially they are all collapsed.
  const [expandedAssetIds, setExpandedAssetIds] = useState<string[]>([]);

  const toggleExpandAsset = (id: string) => {
    if (expandedAssetIds.includes(id)) {
      setExpandedAssetIds(expandedAssetIds.filter(item => item !== id));
    } else {
      setExpandedAssetIds([...expandedAssetIds, id]);
    }
  };

  // Initialize values when bottom sheet opens or changes
  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setTitle(editingGoal.title);
        setTargetAmount(editingGoal.targetAmount);
        setDurationYears(editingGoal.durationYears);
        
        const savedDown = editingGoal.downPayment !== undefined ? editingGoal.downPayment : editingGoal.targetAmount;
        const savedLoan = editingGoal.loanAmount !== undefined ? editingGoal.loanAmount : 0;
        setDownPayment(savedDown);
        setLoanAmount(savedLoan);
        
        // Load allocations
        if (editingGoal.allocations && editingGoal.allocations.length > 0) {
          setSelectedSubAssetIds(editingGoal.allocations.map(a => a.subAssetId));
        } else {
          // If legacy goal, convert it to allocations
          if (editingGoal.allocatedSubAssetId === "all") {
            const asset = assets.find(a => a.id === editingGoal.allocatedAssetId);
            if (asset) {
              setSelectedSubAssetIds(asset.subAssets.map(sa => sa.id));
            } else {
              setSelectedSubAssetIds([]);
            }
          } else if (editingGoal.allocatedSubAssetId && editingGoal.allocatedSubAssetId !== "multiple") {
            setSelectedSubAssetIds([editingGoal.allocatedSubAssetId]);
          } else {
            setSelectedSubAssetIds([]);
          }
        }
      } else {
        setTitle(category);
        setTargetAmount(defaults.amount);
        setDurationYears(defaults.years);
        setDownPayment(defaults.amount);
        setLoanAmount(0);
        
        // Sensible default based on category: select all sub assets of default asset category (that are not committed elsewhere)
        const defaultAsset = assets.find(a => a.id === defaults.assetId);
        if (defaultAsset) {
          const availableSubIds = defaultAsset.subAssets
            .map(sa => sa.id)
            .filter(id => !getSubAssetOwnerGoal(id));
          setSelectedSubAssetIds(availableSubIds);
        } else {
          setSelectedSubAssetIds([]);
        }
      }
    }
  }, [isOpen, category, editingGoal]);


  if (!isOpen) return null;

  // Find all selected sub-assets details
  const selectedSubAssetsList: { sub: SubAsset; parent: AssetCategory }[] = [];
  assets.forEach((asset) => {
    asset.subAssets.forEach((sub) => {
      if (selectedSubAssetIds.includes(sub.id)) {
        selectedSubAssetsList.push({ sub, parent: asset });
      }
    });
  });

  // Calculate current committed balance value
  const currentValueAllocated = selectedSubAssetsList.reduce((sum, item) => sum + item.sub.value, 0);

  // Calculate nominal growth rate of allocated selection (weighted average)
  let nominalRate = 10; // Safe default
  if (currentValueAllocated > 0) {
    const totalWeightedYield = selectedSubAssetsList.reduce((sum, item) => sum + (item.sub.value * item.sub.growthRate), 0);
    nominalRate = totalWeightedYield / currentValueAllocated;
  }

  // Real Future Value accounting for 6% inflation
  const realFutureValue = calculateFutureValue(
    currentValueAllocated,
    nominalRate,
    durationYears,
    true // 6% inflation subtracted
  );

  const shortfall = Math.max(0, downPayment - realFutureValue);
  const achievedPercentage = downPayment > 0 ? Math.min(100, (currentValueAllocated / downPayment) * 100) : 100;
  const isSufficient = realFutureValue >= downPayment;

  // Handle saving goal
  const handleSave = () => {
    // Fallback info for general tracking
    let mainAssetId = "stocks";
    let mainSubAssetId = "all";
    if (selectedSubAssetIds.length === 1) {
      const singleSubId = selectedSubAssetIds[0];
      const foundAsset = assets.find(a => a.subAssets.some(sa => sa.id === singleSubId));
      if (foundAsset) {
        mainAssetId = foundAsset.id;
        mainSubAssetId = singleSubId;
      }
    } else if (selectedSubAssetIds.length > 1) {
      const uniqueAssetIds = Array.from(new Set<string>(
        selectedSubAssetIds.map(subId => {
          const parent = assets.find(a => a.subAssets.some(sa => sa.id === subId));
          return parent ? parent.id : "";
        }).filter(Boolean)
      ));
      if (uniqueAssetIds.length === 1) {
        mainAssetId = uniqueAssetIds[0];
        const categoryAsset = assets.find(a => a.id === mainAssetId);
        if (categoryAsset && categoryAsset.subAssets.length === selectedSubAssetIds.length) {
          mainSubAssetId = "all";
        } else {
          mainSubAssetId = "multiple";
        }
      } else {
        mainAssetId = "multiple";
        mainSubAssetId = "multiple";
      }
    }

    const allocationsList = selectedSubAssetIds.map(subId => {
      const parent = assets.find(a => a.subAssets.some(sa => sa.id === subId));
      return {
        assetId: parent ? parent.id : "",
        subAssetId: subId
      };
    });

    const goal: Goal = {
      id: editingGoal ? editingGoal.id : `${category.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      category,
      title: title || category,
      iconName: getCategoryIcon(category),
      targetAmount,
      durationYears,
      allocatedAssetId: mainAssetId,
      allocatedSubAssetId: mainSubAssetId,
      allocations: allocationsList,
      currentValueAllocated,
      futureValueAllocated: realFutureValue,
      shortfall,
      achievedPercentage,
      downPayment,
      loanAmount,
    };
    onSaveGoal(goal);
    onClose();
  };

  function getCategoryIcon(cat: string): string {
    switch (cat.toLowerCase()) {
      case "buying a car":
        return "Car";
      case "planning a trip":
        return "PlaneTakeoff";
      case "buying a house":
        return "Home";
      case "getting married":
        return "Gift";
      default:
        return "Milestone";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      {/* Sheet Content Container */}
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-xl relative z-10 flex flex-col max-h-[92vh] overflow-hidden"
        id="goal-bottom-sheet"
      >
        {/* Drag handlebar indicator */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3 shrink-0"></div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-light border border-slate-200 rounded-lg text-brand">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-slate-900 text-md font-bold leading-none">
                {editingGoal ? "Modify goal settings" : `New plan: ${category}`}
              </h3>
              <p className="text-slate-500 text-3xs mt-1 font-semibold">
                Earmark multiple assets, customize targets, and check math pathways.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Custom Goal Title (only if custom category or editing) */}
          <div className="space-y-2">
            <label className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              Goal custom tag or title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Tesla Model 3 fund"
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand/40 rounded-xl px-4 py-3 text-slate-850 text-xs font-bold outline-none transition-all"
            />
          </div>

          {/* Goal target Slider */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-baseline">
              <label className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                Goal funding size required
              </label>
              <span className="text-brand font-black text-sm font-sans">
                {formatIndianCurrency(targetAmount)}
              </span>
            </div>
            <input
              type="range"
              min={100000}
              max={15000000}
              step={50000}
              value={targetAmount}
              onChange={(e) => {
                const newAmount = Number(e.target.value);
                setTargetAmount(newAmount);
                setDownPayment(newAmount);
                setLoanAmount(0);
              }}
              className="w-full accent-brand h-1.5 bg-slate-150 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-slate-450 text-slate-500 text-[9px] font-bold font-mono">
              <span>₹1 L</span>
              <span>₹50 L</span>
              <span>₹1 Cr</span>
              <span>₹1.5 Cr</span>
            </div>
          </div>

          {/* Co-Funding Split Sliders (Down Payment vs Loan) */}
          <div className="bg-violet-50/40 p-4 border border-violet-100 rounded-2xl space-y-4">
            <h4 className="text-[10.5px] text-violet-950 font-black uppercase tracking-wide flex items-center justify-between">
              <span>Fund Split Blueprint</span>
              <span className="text-[9px] bg-violet-100 text-violet-800 border border-violet-200/50 px-2 py-0.5 rounded-md font-bold font-sans">
                Interactive Split
              </span>
            </h4>
            
            {/* Down Payment Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Down Payment (Earmarked assets backing)</span>
                <span className="text-violet-700 font-extrabold">{formatIndianCurrency(downPayment)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={targetAmount}
                step={25000}
                value={downPayment}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDownPayment(val);
                  setLoanAmount(targetAmount - val);
                }}
                className="w-full accent-violet-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-bold font-mono">
                <span>0% Upfront</span>
                <span>{targetAmount > 0 ? ((downPayment / targetAmount) * 100).toFixed(0) : 0}% Self-Funded</span>
                <span>Max {formatIndianCurrency(targetAmount, true)}</span>
              </div>
            </div>

            {/* Loan Amount Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Loan Amount (Debt component)</span>
                <span className="text-cyan-700 font-extrabold">{formatIndianCurrency(loanAmount)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={targetAmount}
                step={25000}
                value={loanAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLoanAmount(val);
                  setDownPayment(targetAmount - val);
                }}
                className="w-full accent-cyan-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-bold font-mono">
                <span>0% Loan</span>
                <span>{targetAmount > 0 ? ((loanAmount / targetAmount) * 100).toFixed(0) : 0}% Debt-Funded</span>
                <span>Max {formatIndianCurrency(targetAmount, true)}</span>
              </div>
            </div>
          </div>

          {/* Real-time Loan EMI & SWP Arbitrage Math Block */}
          {loanAmount > 0 && (
            <div className="bg-gradient-to-br from-cyan-50 to-emerald-50/50 border border-cyan-200 p-4 rounded-2xl space-y-3 shadow-3xs animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-cyan-950 font-extrabold text-[11px] uppercase tracking-wider">
                <Landmark className="w-4 h-4 text-cyan-600 animate-bounce" />
                <span>Smart Loan EMI & SWP Arbitrage Math</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2.5 border-b border-cyan-150">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                    Estimated EMI (at 8% p.a.)
                  </span>
                  <span className="text-cyan-950 font-sans text-xs font-black">
                    {formatIndianCurrency(calculateEMI(loanAmount, 8, durationYears))}
                    <span className="text-[9px] text-slate-500 font-bold"> /mo</span>
                  </span>
                  <span className="text-[8px] text-slate-500 block font-semibold">
                    Over {durationYears} year tenure
                  </span>
                </div>
                
                <div className="space-y-0.5">
                  <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block">
                    Equivalent MF SWP Corpus
                  </span>
                  <span className="text-emerald-950 font-sans text-xs font-black">
                    {formatIndianCurrency(calculateSwpCorpusRequired(calculateEMI(loanAmount, 8, durationYears), 12, durationYears))}
                  </span>
                  <span className="text-[8.5px] text-emerald-750 block font-black font-sans leading-none">
                    Saves {formatIndianCurrency(loanAmount - calculateSwpCorpusRequired(calculateEMI(loanAmount, 8, durationYears), 12, durationYears), true)} upfront!
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-cyan-100 rounded-xl space-y-1.5 text-[10px] sm:text-[10.5px] text-slate-700 font-medium leading-relaxed">
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>How the Arbitrage Math works:</span>
                </div>
                <p>
                  1. Since the loan interest rate is <span className="text-pink-600 font-black">8% p.a.</span>, your calculated monthly EMI payment is <span className="font-extrabold text-slate-800">{formatIndianCurrency(calculateEMI(loanAmount, 8, durationYears))}</span>.
                </p>
                <p>
                  2. Rather than paying the bank in cash, you should select a <span className="text-brand font-black font-sans">Systematic Withdrawal Plan (SWP)</span> from your Mutual Fund compounding at a historical nominal yield of <span className="text-emerald-600 font-black">12% p.a.</span>.
                </p>
                <p>
                  3. Due to this 4% rate differential compounding in your favor, a starting corpus of just <b className="text-slate-900 font-black">{formatIndianCurrency(calculateSwpCorpusRequired(calculateEMI(loanAmount, 8, durationYears), 12, durationYears))}</b> inside your mutual fund is sufficient to fund the entire loan tenure of EMIs, saving you <b className="text-emerald-700 font-black">{formatIndianCurrency(loanAmount - calculateSwpCorpusRequired(calculateEMI(loanAmount, 8, durationYears), 12, durationYears))} ({((1 - calculateSwpCorpusRequired(calculateEMI(loanAmount, 8, durationYears), 12, durationYears) / loanAmount) * 100).toFixed(1)}%)</b> in upfront capital!
                </p>
              </div>
            </div>
          )}

          {/* Duration slider */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-baseline">
              <label className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                Time duration plan
              </label>
              <span className="text-brand font-black text-sm">
                {durationYears} {durationYears === 1 ? "year" : "years"}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={durationYears}
              onChange={(e) => setDurationYears(Number(e.target.value))}
              className="w-full accent-brand h-1.5 bg-slate-150 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-slate-450 text-slate-500 text-[9px] font-bold lg:font-semibold">
              <span>1 year</span>
              <span>5 years</span>
              <span>10 years</span>
              <span>15 years</span>
              <span>25 years</span>
            </div>
          </div>

          {/* Earmark Assets Selector */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h4 className="text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-brand" />
                Select and earmark assets
              </h4>
              <span className="text-[10px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full">
                {selectedSubAssetIds.length} fund{selectedSubAssetIds.length !== 1 ? "s" : ""} checked
              </span>
            </div>

            <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
              Toggle any assets or specific fund sub-types to back your goal. Compounds using exact weighted compounding rates.
            </p>

            <div className="space-y-3 px-0.5">
              {assets.map((asset) => {
                // Check if all available sub-assets under this asset are checked
                const assetSubIds = asset.subAssets.map(sa => sa.id);
                const uncommittedAssetSubIds = assetSubIds.filter(id => !getSubAssetOwnerGoal(id));
                const allChecked = uncommittedAssetSubIds.length > 0 && uncommittedAssetSubIds.every(id => selectedSubAssetIds.includes(id));
                const someChecked = assetSubIds.some(id => selectedSubAssetIds.includes(id)) && !allChecked;

                const handleToggleAllAsset = (e: React.ChangeEvent<HTMLInputElement>) => {
                  e.stopPropagation();
                  if (allChecked) {
                    // Uncheck all sub-assets under this category
                    setSelectedSubAssetIds(prev => prev.filter(id => !assetSubIds.includes(id)));
                  } else {
                    // Check all sub-assets under this category that are NOT committed to other goals
                    const otherChecked = selectedSubAssetIds.filter(id => !assetSubIds.includes(id));
                    setSelectedSubAssetIds([...otherChecked, ...uncommittedAssetSubIds]);
                  }
                };

                const isExpanded = expandedAssetIds.includes(asset.id);

                return (
                  <div key={asset.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 shadow-3xs hover:border-slate-300">
                    {/* Collapsible Category Header - Clicking anywhere toggles the dropdown, except the custom checkbox itself */}
                    <div 
                      onClick={() => toggleExpandAsset(asset.id)}
                      className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50 active:bg-slate-100/60"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(el) => {
                            if (el) el.indeterminate = someChecked;
                          }}
                          onClick={(e) => e.stopPropagation()} // Stop checkbox click from acting as toggle expand
                          onChange={handleToggleAllAsset}
                          className="w-4 h-4 text-brand bg-slate-100 border-slate-300 rounded focus:ring-brand accent-brand cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900 truncate tracking-tight">
                          {asset.name}
                        </span>
                        <span className="text-slate-400 text-[10px] font-semibold shrink-0">
                          ({asset.subAssets.length})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-600 font-mono">
                          {formatIndianCurrency(asset.totalValue, true)}
                        </span>
                        <div className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sub-assets listed inside (Visible only when expanded) */}
                    {isExpanded && (
                      <div className="p-3.5 space-y-2.5 border-t border-slate-150 bg-white">
                        {asset.subAssets.map((sub) => {
                          const ownerGoal = getSubAssetOwnerGoal(sub.id);
                          const isSubChecked = selectedSubAssetIds.includes(sub.id);
                          
                          const handleToggleSub = () => {
                            if (ownerGoal) return; // Prevent selection of committed assets
                            if (isSubChecked) {
                              setSelectedSubAssetIds(prev => prev.filter(id => id !== sub.id));
                            } else {
                              setSelectedSubAssetIds(prev => [...prev, sub.id]);
                            }
                          };

                          return (
                            <div key={sub.id} className={`flex justify-between items-center text-xs p-1 rounded-lg ${ownerGoal ? "bg-slate-50/70 opacity-80" : ""}`}>
                              <label className={`flex items-center gap-2 select-none min-w-0 flex-1 ${ownerGoal ? "cursor-not-allowed text-slate-400" : "cursor-pointer"}`}>
                                <input
                                  type="checkbox"
                                  checked={isSubChecked}
                                  disabled={!!ownerGoal}
                                  onChange={handleToggleSub}
                                  className={`w-3.5 h-3.5 rounded focus:ring-brand accent-brand ${
                                    ownerGoal 
                                      ? "text-slate-300 bg-slate-200 border-slate-200 cursor-not-allowed" 
                                      : "text-brand bg-slate-50 border-slate-250 cursor-pointer"
                                  }`}
                                />
                                <div className="truncate flex flex-wrap items-center gap-1.5 min-w-0">
                                  <span className={`text-[11px] font-medium truncate ${ownerGoal ? "text-slate-450 font-normal" : "text-slate-700 hover:text-slate-950"}`}>
                                    {sub.name}
                                  </span>
                                  {ownerGoal && (
                                    <span className="text-[9px] bg-amber-50/80 text-amber-700 border border-amber-200/50 px-1.5 py-0.5 rounded font-bold shrink-0">
                                      earmarked for {ownerGoal.title.toLowerCase()}
                                    </span>
                                  )}
                                </div>
                              </label>
                              <span className={`text-[10.5px] font-extrabold text-slate-500 shrink-0 font-sans ml-2 ${ownerGoal ? "text-slate-400" : ""}`}>
                                {formatIndianCurrency(sub.value, true)} ({sub.growthRate}% p.a.)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Math calculation response block */}
          <div className={`p-4 rounded-xl border flex gap-3.5 ${
            isSufficient
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : "bg-rose-50 border-rose-200 text-rose-950"
          }`}>
            <div className="shrink-0 mt-0.5">
              {isSufficient ? (
                <ShieldCheck className="w-5 h-5 text-emerald-700 pointer-events-none" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-700 pointer-events-none" />
              )}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wide">
                {isSufficient ? "Goal fully covered" : "Funding shortfall detected"}
              </div>
              <p className="text-slate-700 text-[10px] leading-relaxed font-semibold">
                Committed asset value of <b className="text-slate-900 font-extrabold">{formatIndianCurrency(currentValueAllocated)}</b> will compound to <b className="text-slate-900 font-extrabold">{formatIndianCurrency(realFutureValue)}</b> in <b className="text-slate-900 font-extrabold">{durationYears} years</b> at a real compounded rate of <b className="text-slate-900 font-extrabold">{(nominalRate - 6).toFixed(1)}%</b>.
              </p>
              {!isSufficient && (
                <div className="space-y-1.5 mt-1 pb-1 border-t border-rose-200/40">
                  <div className="text-rose-700 text-xs font-bold font-sans">
                    Gap shortfall: {formatIndianCurrency(shortfall)}
                  </div>
                  <div className="text-slate-800 text-[11px] font-bold leading-relaxed">
                    Suggested action: <span className="text-brand">invest {formatIndianCurrency(calculateMonthlySIP(shortfall, nominalRate, durationYears))} monthly</span> fresh into these earmarked assets to bridge this gap in {durationYears} {durationYears === 1 ? "year" : "years"}.
                  </div>
                </div>
              )}
              {isSufficient && (
                <div className="text-emerald-700 text-xs font-bold font-sans mt-1.5">
                  Surplus reserve: {formatIndianCurrency(realFutureValue - downPayment)} (achievable)
                </div>
              )}
              <div className="text-[10px] text-slate-500 leading-tight font-medium pt-1">
                * Real future value compounding includes a 6.0% deducible inflation projection on selected sub-assets.
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-3xs"
          >
            Discard
          </button>
          
          <button
            onClick={handleSave}
            disabled={selectedSubAssetIds.length === 0}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border ${
              selectedSubAssetIds.length === 0
                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                : "bg-brand hover:bg-brand-hover text-white border-brand/35"
            }`}
            id="save-goal-action-btn"
          >
            <Sparkles className="w-3.5 h-3.5 pointer-events-none" />
            <span>{editingGoal ? "Apply updates" : "Earmark life goal"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
