/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Sliders, Coins, ShieldCheck, AlertCircle, Sparkles, ChevronDown, ChevronUp, Landmark, FileSpreadsheet, ArrowRight, ArrowLeft, CalendarDays } from "lucide-react";
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
  onStartSip?: (goal: Goal, recommendedAmount: number) => void;
}

export default function GoalBottomSheet({
  isOpen,
  onClose,
  category,
  assets: rawAssets,
  onSaveGoal,
  editingGoal,
  goals,
  onStartSip,
}: GoalBottomSheetProps) {
  const assets = rawAssets.filter(
    (a) => a.id !== "nps" && a.id !== "ppf" && a.id !== "esops" && a.id !== "real_estate"
  );

  // Find which other goal owns a sub asset
  const getSubAssetOwnerGoal = (subId: string): Goal | undefined => {
    return goals.find(
      (g) => g.id !== editingGoal?.id && g.allocations && g.allocations.some((a) => a.subAssetId === subId)
    );
  };

  // Pre-populated defaults based on category
  const getDefaultValues = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "buying a car":
        return { amount: 1500000, years: 4, assetId: "mutual_funds" };
      case "planning a trip":
        return { amount: 300000, years: 2, assetId: "crypto" };
      case "buying a house":
        return { amount: 8000000, years: 10, assetId: "stocks" };
      case "getting married":
        return { amount: 1200000, years: 3, assetId: "mutual_funds" };
      case "child's education":
        return { amount: 2500000, years: 8, assetId: "mutual_funds" };
      case "pilgrimage":
        return { amount: 500000, years: 3, assetId: "mutual_funds" };
      case "daughter's marriage":
        return { amount: 3500000, years: 10, assetId: "mutual_funds" };
      default:
        return { amount: 500000, years: 5, assetId: "mutual_funds" };
    }
  };

  const defaults = getDefaultValues(category);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState(defaults.amount);
  const [durationYears, setDurationYears] = useState(defaults.years);
  const [downPayment, setDownPayment] = useState(defaults.amount);
  const [loanAmount, setLoanAmount] = useState(0);
  const [hasLoan, setHasLoan] = useState(false);

  // Step Management State (1 = Amount/Loan, 2 = Duration, 3 = Earmark/Compounding)
  const [step, setStep] = useState(1);

  // Array of earmarked sub-asset IDs
  const [selectedSubAssetIds, setSelectedSubAssetIds] = useState<string[]>([]);

  // Array of asset category IDs that are expanded
  const [expandedAssetIds, setExpandedAssetIds] = useState<string[]>([]);

  const toggleExpandAsset = (id: string) => {
    setExpandedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Initialize values when bottom sheet opens or changes
  useEffect(() => {
    if (isOpen) {
      setStep(1); // Default to Step 1 upon entry
      if (editingGoal) {
        setTitle(editingGoal.title);
        setTargetAmount(editingGoal.targetAmount);
        setDurationYears(editingGoal.durationYears);

        const savedDown = editingGoal.downPayment !== undefined ? editingGoal.downPayment : editingGoal.targetAmount;
        const savedLoan = editingGoal.loanAmount !== undefined ? editingGoal.loanAmount : 0;
        setDownPayment(savedDown);
        setLoanAmount(savedLoan);
        setHasLoan(savedLoan > 0);

        // Load allocations
        if (editingGoal.allocations && editingGoal.allocations.length > 0) {
          setSelectedSubAssetIds(editingGoal.allocations.map((a) => a.subAssetId));
        } else {
          // Fallback legacy conversion
          if (editingGoal.allocatedSubAssetId === "all") {
            const asset = assets.find((a) => a.id === editingGoal.allocatedAssetId);
            if (asset) {
              setSelectedSubAssetIds(asset.subAssets.map((sa) => sa.id));
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
        setHasLoan(false);

        // Sensible initial earmark matching
        const defaultAsset = assets.find((a) => a.id === defaults.assetId);
        if (defaultAsset) {
          const availableSubIds = defaultAsset.subAssets
            .map((sa) => sa.id)
            .filter((id) => !getSubAssetOwnerGoal(id));
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
    const totalWeightedYield = selectedSubAssetsList.reduce((sum, item) => sum + item.sub.value * item.sub.growthRate, 0);
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

  // Form input changes handlers with safety guarantees
  const handleTargetAmountInput = (valStr: string) => {
    const numericStr = valStr.replace(/[^0-9]/g, "");
    const valNum = Number(numericStr);
    setTargetAmount(valNum);
    
    if (!hasLoan) {
      setDownPayment(valNum);
      setLoanAmount(0);
    } else {
      // Split constraints: Prepopulate whole amount as downpayment by default, or split it reasonably
      setDownPayment(valNum);
      setLoanAmount(0);
    }
  };

  const handleDurationInput = (valStr: string) => {
    const numericStr = valStr.replace(/[^0-9]/g, "");
    let valNum = Number(numericStr);
    if (valNum > 99) valNum = 99; // cap
    setDurationYears(valNum);
  };

  const handleHasLoanChange = (checked: boolean) => {
    setHasLoan(checked);
    if (checked) {
      // Prepopulate targetAmount as downpayment, loan is 0 initially as per spec
      setDownPayment(targetAmount);
      setLoanAmount(0);
    } else {
      setDownPayment(targetAmount);
      setLoanAmount(0);
    }
  };

  const createGoalObject = (): Goal => {
    let mainAssetId = "stocks";
    let mainSubAssetId = "all";
    if (selectedSubAssetIds.length === 1) {
      const singleSubId = selectedSubAssetIds[0];
      const foundAsset = assets.find((a) => a.subAssets.some((sa) => sa.id === singleSubId));
      if (foundAsset) {
        mainAssetId = foundAsset.id;
        mainSubAssetId = singleSubId;
      }
    } else if (selectedSubAssetIds.length > 1) {
      const uniqueAssetIds = Array.from(
        new Set<string>(
          selectedSubAssetIds
            .map((subId) => {
              const parent = assets.find((a) => a.subAssets.some((sa) => sa.id === subId));
              return parent ? parent.id : "";
            })
            .filter(Boolean)
        )
      );
      if (uniqueAssetIds.length === 1) {
        mainAssetId = uniqueAssetIds[0];
        const categoryAsset = assets.find((a) => a.id === mainAssetId);
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

    const allocationsList = selectedSubAssetIds.map((subId) => {
      const parent = assets.find((a) => a.subAssets.some((sa) => sa.id === subId));
      return {
        assetId: parent ? parent.id : "",
        subAssetId: subId,
      };
    });

    return {
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
  };

  const handleSave = () => {
    onSaveGoal(createGoalObject());
    onClose();
  };

  const handleSaveAndStartSIP = () => {
    const goal = createGoalObject();
    onSaveGoal(goal);
    if (onStartSip) {
      const recommended = calculateMonthlySIP(shortfall, nominalRate, durationYears);
      onStartSip(goal, recommended);
    }
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
      case "child's education":
        return "GraduationCap";
      case "pilgrimage":
        return "Compass";
      case "daughter's marriage":
        return "Heart";
      default:
        return "Milestone";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6">
      {/* Click outside backdrop close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      {/* Spacious Dialog Layout Container */}
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[88vh] overflow-hidden"
        id="goal-bottom-sheet"
      >
        {/* Header (No Subtext) */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-light border border-slate-200 rounded-lg text-brand">
              <Sliders className="w-4 h-4 pointer-events-none" />
            </div>
            <h3 className="text-slate-900 text-base sm:text-lg font-bold leading-none tracking-tight">
              {editingGoal ? `Modify Goal: ${title || category}` : `New Goal: ${category}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Milestone-Based Step Progress Line (small font) */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-150 flex items-center justify-center shrink-0">
          <div className="flex items-center justify-between w-full max-w-sm select-none">
            {/* Step 1 */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
                  step >= 1
                    ? "bg-brand text-white border border-brand/20 shadow-3xs"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                1
              </div>
              <span className={`text-[10.5px] font-bold ${step === 1 ? "text-slate-900" : "text-slate-400"}`}>
                Step 1
              </span>
            </div>

            <div className={`h-[2px] flex-1 mx-3 transition-colors duration-300 ${step >= 2 ? "bg-brand" : "bg-slate-200"}`}></div>

            {/* Step 2 */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
                  step >= 2
                    ? "bg-brand text-white border border-brand/20 shadow-3xs"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                2
              </div>
              <span className={`text-[10.5px] font-bold ${step === 2 ? "text-slate-900" : "text-slate-400"}`}>
                Step 2
              </span>
            </div>

            <div className={`h-[2px] flex-1 mx-3 transition-colors duration-300 ${step >= 3 ? "bg-brand" : "bg-slate-200"}`}></div>

            {/* Step 3 */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 ${
                  step >= 3
                    ? "bg-brand text-white border border-brand/20 shadow-3xs"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                3
              </div>
              <span className={`text-[10.5px] font-bold ${step === 3 ? "text-slate-900" : "text-slate-400"}`}>
                Step 3
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Contents Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: GOAL AMOUNT & SPLIT LOAN MATH */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Custom Title Input */}
              <div className="space-y-1.5">
                <label className="text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">
                  Customize Goal Title / Tag
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Luxury Electric SUV, My First Apartment"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand/40 focus:bg-white rounded-xl px-4 py-2.5 text-slate-850 text-xs font-bold outline-none transition-all"
                />
              </div>

              {/* Goal Target Amount Slider & Text Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">
                    Goal Target value Amount (₹)
                  </label>
                  <span className="text-brand font-black text-sm sm:text-base font-sans leading-none">
                    {formatIndianCurrency(targetAmount)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* Manual input box */}
                  <div className="w-full sm:w-1/3 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="text"
                      value={targetAmount}
                      onChange={(e) => handleTargetAmountInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand/45 focus:bg-white rounded-xl pl-7 pr-3 py-2 text-slate-800 text-xs font-extrabold outline-none transition-all"
                      placeholder="Enter amount"
                    />
                  </div>
                  {/* Slider */}
                  <div className="w-full sm:w-2/3 flex flex-col gap-1 shrink-0">
                    <input
                      type="range"
                      min={50000}
                      max={15000000}
                      step={25000}
                      value={targetAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTargetAmount(val);
                        setDownPayment(val);
                        setLoanAmount(0);
                      }}
                      className="w-full accent-brand h-1.5 bg-slate-150 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-slate-400 text-[9px] font-bold font-mono">
                      <span>₹50 K</span>
                      <span>₹50 L</span>
                      <span>₹1 Cr</span>
                      <span>₹1.5 Cr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* "Do you have a loan?" Checkbox */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <label className="flex items-center gap-3.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasLoan}
                    onChange={(e) => handleHasLoanChange(e.target.checked)}
                    className="w-4.5 h-4.5 text-brand bg-white border-slate-300 rounded focus:ring-brand accent-brand cursor-pointer"
                  />
                  <div>
                    <span className="text-slate-900 text-xs font-bold block">Do you have a loan for this goal?</span>
                  </div>
                </label>

                {/* Amount Split Display if Checkbox Checked */}
                {hasLoan && (
                  <div className="bg-white border border-slate-200/80 p-4 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
                      Co-Funding Split Blueprint (Sum Equals Total Portfolio Goal Amount)
                    </h4>

                    {/* Down payment setup */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline text-xs font-semibold">
                        <span className="text-slate-600">Down Payment (Self Earmarked Assets)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">₹</span>
                          <input
                            type="text"
                            value={downPayment}
                            onChange={(e) => {
                              const cleanDigits = e.target.value.replace(/[^0-9]/g, "");
                              let cleanNum = Math.min(targetAmount, Number(cleanDigits));
                              setDownPayment(cleanNum);
                              setLoanAmount(targetAmount - cleanNum);
                            }}
                            className="w-24 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right text-[11px] font-extrabold focus:bg-white outline-none"
                          />
                        </div>
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
                        className="w-full accent-brand h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-slate-450 font-bold font-mono">
                        <span>0% Upfront</span>
                        <span>{targetAmount > 0 ? ((downPayment / targetAmount) * 100).toFixed(0) : 0}% Downpayment</span>
                        <span>Max {formatIndianCurrency(targetAmount, true)}</span>
                      </div>
                    </div>

                    {/* Loan component setup */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline text-xs font-semibold">
                        <span className="text-slate-600">Loan Amount (Debt component)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">₹</span>
                          <input
                            type="text"
                            value={loanAmount}
                            onChange={(e) => {
                              const cleanDigits = e.target.value.replace(/[^0-9]/g, "");
                              let cleanNum = Math.min(targetAmount, Number(cleanDigits));
                              setLoanAmount(cleanNum);
                              setDownPayment(targetAmount - cleanNum);
                            }}
                            className="w-24 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right text-[11px] font-extrabold focus:bg-white outline-none"
                          />
                        </div>
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
                      <div className="flex justify-between text-[8px] text-slate-450 font-bold font-mono">
                        <span>0% Loan</span>
                        <span>{targetAmount > 0 ? ((loanAmount / targetAmount) * 100).toFixed(0) : 0}% Debt Split</span>
                        <span>Max {formatIndianCurrency(targetAmount, true)}</span>
                      </div>
                    </div>

                    {/* EMI / SWP Arbitrage teaser mini preview card */}
                    {loanAmount > 0 && (
                      <div className="p-3 bg-cyan-50/50 border border-cyan-150 rounded-xl text-[10.5px] text-slate-700 leading-relaxed space-y-1">
                        <span className="font-extrabold text-cyan-950 flex items-center gap-1">
                          <Landmark className="w-3.5 h-3.5 text-cyan-600" />
                          Estimated Monthly EMI: <b>{formatIndianCurrency(calculateEMI(loanAmount, 8, durationYears))}/mo</b>
                        </span>
                        <p>We'll show you an advanced 12% p.a. SWP investment model to save on loan interests in Step 3!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: GOAL DURATION / TIMELINE PATHS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-3.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-slate-500 text-[10px] uppercase tracking-wider font-extrabold">
                    Goal Planning Horizon Year Duration
                  </label>
                  <span className="text-brand font-black text-sm sm:text-base font-sans">
                    {durationYears} {durationYears === 1 ? "year" : "years"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* Manual duration selector */}
                  <div className="w-full sm:w-1/3 relative">
                    <input
                      type="text"
                      value={durationYears}
                      onChange={(e) => handleDurationInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand/45 focus:bg-white rounded-xl px-3 py-2 text-slate-800 text-xs font-extrabold outline-none"
                      placeholder="e.g. 5"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold uppercase">Yrs</span>
                  </div>
                  {/* Duration slider */}
                  <div className="w-full sm:w-2/3 flex flex-col gap-1">
                    <input
                      type="range"
                      min={1}
                      max={25}
                      step={1}
                      value={durationYears}
                      onChange={(e) => setDurationYears(Number(e.target.value))}
                      className="w-full accent-brand h-1.5 bg-slate-150 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-slate-400 text-[9px] font-bold font-mono">
                      <span>1 Year</span>
                      <span>5 Years</span>
                      <span>10 Years</span>
                      <span>15 Years</span>
                      <span>25 Years</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic guide box */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 flex gap-3.5 items-start">
                <div className="p-2 bg-white border border-indigo-100 rounded-xl text-indigo-650 shrink-0">
                  <CalendarDays className="w-5 h-5 pointer-events-none" />
                </div>
                <div className="space-y-1">
                  <span className="text-indigo-950 font-extrabold text-xs tracking-tight">Timeline math compounding adjustments</span>
                  <p className="text-slate-600 text-[10.5px] leading-relaxed">
                    Planning for a <b>{durationYears} year</b> horizon lets earmark allocations appreciate in stock yields and high-growth mutual funds. Shorter goals can require safe index products.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FROZEN STICKY BAR, ASSET ALLOCATION & SIP FORM */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200 relative">              {/* Compact summary allocation card (Not sticky, does not affect list scroll) */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2 shadow-3xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                  <span className="text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                    Earmarked Assets: <b>{formatIndianCurrency(currentValueAllocated)}</b> of {formatIndianCurrency(downPayment, true)}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">Progress:</span>
                    <span className="text-xs font-extrabold text-brand">{achievedPercentage.toFixed(0)}%</span>
                  </div>
                </div>

                {/* Slim progress line */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border border-slate-100">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${achievedPercentage}%` }}
                  ></div>
                </div>

                {/* Real-time details callout */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-slate-200/50 pt-2">
                  <div>
                    {!isSufficient ? (
                      <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Shortfall: {formatIndianCurrency(shortfall)} (Needs {formatIndianCurrency(calculateMonthlySIP(shortfall, nominalRate, durationYears))}/mo SIP)
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        Capital pool compounding covers this goal upfront!
                      </span>
                    )}
                  </div>

                  {!isSufficient && onStartSip && (
                    <button
                      type="button"
                      onClick={handleSaveAndStartSIP}
                      className="bg-brand hover:bg-brand-hover text-white text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg active:scale-95 transition-all shadow-3xs cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                      <span>Start SIP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Asset list selection area */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-brand" />
                    Available assets portfolio audit
                  </h4>
                  <span className="text-[10px] font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded-full">
                    {selectedSubAssetIds.length} sub-assets earmarked
                  </span>
                </div>

                <div className="space-y-3">
                  {assets.map((asset) => {
                    const assetSubIds = asset.subAssets.map((sa) => sa.id);
                    const uncommittedAssetSubIds = assetSubIds.filter((id) => !getSubAssetOwnerGoal(id));
                    const allChecked =
                      uncommittedAssetSubIds.length > 0 &&
                      uncommittedAssetSubIds.every((id) => selectedSubAssetIds.includes(id));
                    const someChecked = assetSubIds.some((id) => selectedSubAssetIds.includes(id)) && !allChecked;

                    const handleToggleAllAsset = (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.stopPropagation();
                      if (allChecked) {
                        setSelectedSubAssetIds((prev) => prev.filter((id) => !assetSubIds.includes(id)));
                      } else {
                        const otherChecked = selectedSubAssetIds.filter((id) => !assetSubIds.includes(id));
                        setSelectedSubAssetIds([...otherChecked, ...uncommittedAssetSubIds]);
                      }
                    };

                    const isExpanded = expandedAssetIds.includes(asset.id);

                    return (
                      <div
                        key={asset.id}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 shadow-3xs hover:border-slate-350"
                      >
                        {/* Collapsible item category bar */}
                        <div
                          onClick={() => toggleExpandAsset(asset.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-slate-50/30 hover:bg-slate-50 border-b border-transparent"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              ref={(el) => {
                                if (el) el.indeterminate = someChecked;
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onChange={handleToggleAllAsset}
                              className="w-4 h-4 text-brand bg-slate-100 border-slate-300 rounded focus:ring-brand accent-brand cursor-pointer"
                            />
                            <span className="text-xs font-extrabold text-slate-800 truncate tracking-tight">
                              {asset.name}
                            </span>
                            <span className="text-slate-400 text-[10px] font-semibold shrink-0">
                              ({asset.subAssets.length})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-slate-600 font-mono">
                              {formatIndianCurrency(asset.totalValue, true)}
                            </span>
                            <div className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>

                        {/* List dropdown of sub assets underneath */}
                        {isExpanded && (
                          <div className="p-3 bg-white space-y-2 border-t border-slate-150 animate-in fade-in duration-100">
                            {asset.subAssets.map((sub) => {
                              const ownerGoal = getSubAssetOwnerGoal(sub.id);
                              const isSubChecked = selectedSubAssetIds.includes(sub.id);

                              const handleToggleSub = () => {
                                if (ownerGoal) return;
                                if (isSubChecked) {
                                  setSelectedSubAssetIds((prev) => prev.filter((id) => id !== sub.id));
                                } else {
                                  setSelectedSubAssetIds((prev) => [...prev, sub.id]);
                                }
                              };

                              return (
                                <div
                                  key={sub.id}
                                  className={`flex justify-between items-center text-xs p-1.5 rounded-lg transition-colors ${
                                    ownerGoal ? "bg-slate-50/50 opacity-80" : "hover:bg-slate-50"
                                  }`}
                                >
                                  <label
                                    className={`flex items-center gap-2 select-none min-w-0 flex-1 ${
                                      ownerGoal ? "cursor-not-allowed text-slate-400" : "cursor-pointer"
                                    }`}
                                  >
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
                                      <span
                                        className={`text-[11px] font-medium truncate ${
                                          ownerGoal ? "text-slate-400 font-normal" : "text-slate-700 font-bold"
                                        }`}
                                      >
                                        {sub.name}
                                      </span>
                                      {ownerGoal && (
                                        <span className="text-[8.5px] bg-amber-50 text-amber-700 border border-amber-200/50 px-1.5 py-0.5 rounded font-bold shrink-0 uppercase tracking-wide">
                                          earmarked for: {ownerGoal.title}
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                  <span
                                    className={`text-[10px] font-bold text-slate-500 shrink-0 font-mono ml-2 ${
                                      ownerGoal ? "text-slate-400" : ""
                                    }`}
                                  >
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

              {/* Shortened SWP Arbitrage pathway card */}
              {loanAmount > 0 && (() => {
                const emiAmount = calculateEMI(loanAmount, 8, durationYears);
                const corpusNeeded = calculateSwpCorpusRequired(emiAmount, 12, durationYears);
                
                let fundYName = "your earmarked fund";
                const selectedSubAssetsWithSufficient = selectedSubAssetsList.filter(item => item.sub.value >= corpusNeeded);
                if (selectedSubAssetsWithSufficient.length > 0) {
                  selectedSubAssetsWithSufficient.sort((a, b) => b.sub.value - a.sub.value);
                  fundYName = selectedSubAssetsWithSufficient[0].sub.name;
                } else if (selectedSubAssetsList.length > 0) {
                  const sortedSelected = [...selectedSubAssetsList].sort((a, b) => b.sub.value - a.sub.value);
                  fundYName = sortedSelected[0].sub.name;
                } else {
                  let allSubAssets: SubAsset[] = [];
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

                return (
                  <div className="bg-gradient-to-r from-cyan-50/50 to-emerald-50/30 border border-cyan-200/40 p-4 rounded-xl space-y-1.5 shadow-3xs animate-in slide-in-from-top-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-cyan-600" />
                        EMI for Loan
                      </span>
                      <span className="text-rose-600 font-extrabold text-xs font-sans">
                        {formatIndianCurrency(emiAmount)} per month
                      </span>
                    </div>
                    <p className="text-slate-600 text-[10.5px] leading-relaxed font-semibold">
                      You can pay loan EMIs through SWP of {formatIndianCurrency(emiAmount)} amount in <b className="text-cyan-900">{fundYName}</b>
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer Actions Row */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3.5 shrink-0 justify-between items-center">
          
          {/* Back btn / Discard btn */}
          {step === 1 ? (
            <button
              onClick={onClose}
              className="py-2.5 px-4.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-3xs flex items-center gap-1.5"
            >
              Discard
            </button>
          ) : (
            <button
              onClick={() => setStep((p) => p - 1)}
              className="py-2.5 px-4.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-3xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {/* Forward btn / Create btn */}
          {step < 3 ? (
            <button
              onClick={() => setStep((p) => p + 1)}
              disabled={targetAmount <= 0}
              className={`py-2.5 px-6 rounded-xl text-xs font-extrabold active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer border ${
                targetAmount <= 0
                  ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                  : "bg-brand hover:bg-brand-hover text-white border-brand/30"
              }`}
            >
              <span>Proceed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={selectedSubAssetIds.length === 0}
              className={`py-2.5 px-6 rounded-xl text-xs font-extrabold active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer border ${
                selectedSubAssetIds.length === 0
                  ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                  : "bg-brand hover:bg-brand-hover text-white border-brand/35"
              }`}
              id="save-goal-action-btn"
            >
              <Sparkles className="w-3.5 h-3.5 pointer-events-none text-white" />
              <span>{editingGoal ? "Apply Updates" : "Create Goal"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
