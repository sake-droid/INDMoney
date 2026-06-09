/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Send, CheckCircle2, ArrowRight, HelpCircle, AlertCircle, ShoppingBag, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AssetCategory, Goal, UserProfile } from "../types";
import { formatIndianCurrency, calculateFutureValue } from "../utils/finance";

interface NaturalLanguageBarProps {
  goals: Goal[];
  assets: AssetCategory[];
  profile: UserProfile;
  onSaveGoal: (goal: Goal) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  setActivePlanningTab: (tab: "goals" | "retirement") => void;
}

const samplePrompts = [
  "I want to retire by 52 with a monthly expense of 1.5 Lakhs in today's value. What do I need to do?",
  "I want to buy a car in the next three years worth 20L, what should I do",
  "I want to buy a house in 10 years worth 1.5 Crores. Help me plan.",
  "I want to plan a trip in 2 years worth 5 Lakhs, what's my roadmap?",
  "I want to retire at age 55 with an expense of 3 Lakhs monthly."
];

// Helper to extract custom goal titles and clean them up
function parseCustomGoalDetails(inputText: string): { category: string; title: string } {
  const normalized = inputText.toLowerCase();
  
  // First, let's extract the core subject text
  let subject = "";
  
  // Look for target action introductions
  const triggers = [
    "i want to buy a ", "i want to buy ", "buy a ", "buy ",
    "i want to plan a ", "i want to plan ", "plan a ", "plan ", "planning a ",
    "i want to save for ", "i want to save ", "save for ", "save ",
    "i want to get a ", "i want to get ", "get a ", "get ",
    "i want to build a ", "i want to build ", "build a ", "build ",
    "i want to fund ", "fund ",
    "i want to invest in ", "invest in ",
    "help me plan ", "help me save for ", "help me "
  ];
  
  let bestTriggerIndex = -1;
  let selectedTrigger = "";
  
  for (const trigger of triggers) {
    const idx = normalized.indexOf(trigger);
    if (idx !== -1 && (bestTriggerIndex === -1 || idx < bestTriggerIndex)) {
      bestTriggerIndex = idx;
      selectedTrigger = trigger;
    }
  }
  
  if (bestTriggerIndex !== -1) {
    // Start after the trigger
    subject = inputText.substring(bestTriggerIndex + selectedTrigger.length);
  } else if (normalized.startsWith("i want to ")) {
    subject = inputText.substring(10);
  } else {
    subject = inputText;
  }
  
  // Now, truncate the subject at common trailing limiters (amounts, durations, helper words)
  const separators = [
    /\bworth\b/i,
    /\bin\b/i,
    /\bby\b/i,
    /\bwith\b/i,
    /\bfor\s+\d/i,  // "for 10 years", not "education of my child"
    /\bfor\s+(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+years/i,
    /\bat\b/i,
    /\bto\b/i,
    /\bof\s+rs\b/i,
    /\bof\s+rupees\b/i,
    /,/,
    /\./,
    /\b\d+\s*(?:lakh|lacs|lac|l\b|crore|crores|cr\b)/i,
    /\b(?:₹|rs\.?|inr)?\s*\d{3,}/i
  ];
  
  let earliestCut = subject.length;
  for (const sep of separators) {
    const match = subject.match(sep);
    if (match && match.index !== undefined && match.index < earliestCut) {
      earliestCut = match.index;
    }
  }
  
  subject = subject.substring(0, earliestCut).trim();
  
  // Clean up leading/trailing junk
  subject = subject.replace(/^(?:a|an|the|my|our|to)\s+/i, "");
  subject = subject.trim();
  
  // Capitalize first letters of words
  if (subject) {
    const capitalized = subject
      .split(/\s+/)
      .map(word => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
    
    return {
      category: capitalized,
      title: capitalized
    };
  }
  
  return {
    category: "Custom",
    title: "Bespoke Savings Plan"
  };
}

export default function NaturalLanguageBar({
  goals,
  assets,
  profile,
  onSaveGoal,
  onUpdateProfile,
  setActivePlanningTab,
}: NaturalLanguageBarProps) {
  const [inputText, setInputText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [successResult, setSuccessResult] = useState<{
    type: "retirement" | "goal";
    title: string;
    description: string;
    details: { label: string; value: string }[];
  } | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Auto-rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % samplePrompts.length);
      setFadeKey((prev) => prev + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleSelectSample = (sample: string) => {
    setInputText(sample);
    setErrorText(null);
    setSuccessResult(null);
  };

  const handleParsePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setSuccessResult(null);

    const txt = inputText.trim();
    if (!txt) {
      setErrorText("Please write or select a target financial prompt first.");
      return;
    }

    const normalized = txt.toLowerCase();

    // 1. Detect Intent: Retirement vs Goal
    const isRetirementIntent = 
      normalized.includes("retire") || 
      normalized.includes("retirement") || 
      normalized.includes("pension") || 
      normalized.includes("old age") || 
      normalized.includes("after work");

    if (isRetirementIntent) {
      // ===== RETIREMENT PARSING PATH =====
      // Try to parse Age
      let targetAge = 60; // fallback default
      const ageMatch = normalized.match(/(?:retire\s+by\s+|retire\s+at\s+|retire\s+at\s+age\s+|age\s+of\s+)?\b(4[5-9]|5[0-9]|6[0-9]|7[0-5])\b/i);
      
      if (ageMatch) {
         targetAge = parseInt(ageMatch[1]);
      } else {
         // general search for any numbers
         const generalNumMatch = normalized.match(/\b(4[5-9]|5[0-9]|6[0-9]|7[0-5])\b/);
         if (generalNumMatch) {
           targetAge = parseInt(generalNumMatch[1]);
         }
      }

      // Try to parse monthly expenses
      let monthlyExpense = 150000; // default 1.5L if none parsed
      let parsedExpense = false;

      // Extract Lakhs / lakhs / L / lac / lacs
      const lakhMatch = normalized.match(/([\d.]+)\s*(?:lakh|lacs|lac|l\b)/i);
      // Extract Cr / Crores
      const crMatch = normalized.match(/([\d.]+)\s*(?:crore|crores|cr\b)/i);
      // Extract plain numbers
      const numericMatches = normalized.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d{4,12})/i);

      if (lakhMatch) {
        monthlyExpense = parseFloat(lakhMatch[1]) * 100000;
        parsedExpense = true;
      } else if (crMatch) {
        monthlyExpense = parseFloat(crMatch[1]) * 10000000;
        parsedExpense = true;
      } else if (numericMatches) {
        const raw = parseFloat(numericMatches[1].replace(/,/g, ""));
        if (raw > 5000) {
          monthlyExpense = raw; // assumes direct value is monthly expense
          parsedExpense = true;
        }
      }

      // Safe withdrawal target corpus calculation
      // Under Indian standards, target corpus is roughly annual expenses * 33x factor (representing a 3% inflation-adjusted SWR)
      const annualExpenses = monthlyExpense * 12;
      const computedTargetCorpus = annualExpenses * 33;

      // Apply updates to Profile
      const updatedProfile: UserProfile = {
        ...profile,
        retirementAge: targetAge,
        targetRetirementCorpus: computedTargetCorpus,
      };

      onUpdateProfile(updatedProfile);
      setSuccessResult({
        type: "retirement",
        title: "Retirement Timeline Configured!",
        description: `Successfully adjusted your retirement model parameters. The active projections are now calibrated to purchase-power equivalents starting at age ${targetAge}.`,
        details: [
          { label: "Target Retirement Age", value: `${targetAge} Years` },
          { label: "Desired Monthly Budget", value: `${formatIndianCurrency(monthlyExpense)}/mo` },
          { label: "Computed Target Corpus (33x)", value: formatIndianCurrency(computedTargetCorpus) },
        ],
      });

      // Navigate to the retirement planning tab
      setActivePlanningTab("retirement");
    } else {
      // ===== GOAL SAVING PATH =====
      let targetAmount = 1500000; // default 15 Lakhs
      let durationYears = 5; // default 5 years
      let category = "Custom";
      let iconName = "Milestone";
      let goalTitle = "Bespoke Savings Plan";

      // Parse custom title using new robust extraction logic
      const customParsed = parseCustomGoalDetails(inputText);
      if (customParsed.title) {
        goalTitle = customParsed.title;
        category = customParsed.category;
      }

      // Parse Category & Title mapping if matches predefined categories for better icon selection
      if (normalized.includes("car") || normalized.includes("vehicle") || normalized.includes("bike")) {
        category = "Buying a car";
        iconName = "Car";
        if (goalTitle === "Bespoke Savings Plan" || goalTitle === "Car" || goalTitle === "Vehicle" || goalTitle === "Bike") {
          goalTitle = "Buy a car";
        }
      } else if (normalized.includes("trip") || normalized.includes("vacation") || normalized.includes("holiday") || normalized.includes("travel")) {
        category = "Planning a trip";
        iconName = "PlaneTakeoff";
        if (goalTitle === "Bespoke Savings Plan" || goalTitle === "Trip" || goalTitle === "Vacation" || goalTitle === "Holiday" || goalTitle === "Travel") {
          goalTitle = "Travel Plan";
        }
      } else if (normalized.includes("house") || normalized.includes("home") || normalized.includes("apartment") || normalized.includes("flat") || normalized.includes("property")) {
        category = "Buying a house";
        iconName = "Home";
        if (goalTitle === "Bespoke Savings Plan" || goalTitle === "House" || goalTitle === "Home" || goalTitle === "Apartment" || goalTitle === "Flat" || goalTitle === "Property") {
          goalTitle = "Future House Fund";
        }
      } else if (normalized.includes("wedding") || normalized.includes("marry") || normalized.includes("marriage") || normalized.includes("married")) {
        category = "Getting married";
        iconName = "Gift";
        if (goalTitle === "Bespoke Savings Plan" || goalTitle === "Wedding" || goalTitle === "Marriage") {
          goalTitle = "Marriage Ceremony";
        }
      }

      // Parse Amount (e.g. 20L, 1.5 Crores, etc)
      // Crores
      const crMatch = normalized.match(/([\d.]+)\s*(?:crore|crores|cr\b)/i);
      // Lakhs
      const lakhMatch = normalized.match(/([\d.]+)\s*(?:lakh|lacs|lac|l\b)/i);
      // Plain direct numbers
      const plainMatch = normalized.match(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d{4,12})/i);

      if (crMatch) {
        targetAmount = parseFloat(crMatch[1]) * 10000000;
        goalTitle = `${goalTitle} (${crMatch[1]} Cr)`;
      } else if (lakhMatch) {
        targetAmount = parseFloat(lakhMatch[1]) * 100000;
        goalTitle = `${goalTitle} (${lakhMatch[1]}L)`;
      } else if (plainMatch) {
         const parsedNum = parseFloat(plainMatch[1].replace(/,/g, ""));
         if (parsedNum > 1000) {
           targetAmount = parsedNum;
         }
      }

      // Parse Duration (e.g. next three years, 2 years, etc)
      const yrMatch = normalized.match(/(?:in\s+the\s+next\s+|in\s+|for\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:years|year|yrs|yr)/i);
      const wordToNum: { [key: string]: number } = {
        one: 1, a: 1, single: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
      };

      if (yrMatch) {
        const val = yrMatch[1].toLowerCase();
        if (/^\d+$/.test(val)) {
          durationYears = parseInt(val);
        } else {
          durationYears = wordToNum[val] || 5;
        }
      } else {
        const generalDigits = normalized.match(/\b([1-9]|1[0-9]|2[0-5])\b/);
        if (generalDigits) {
          durationYears = parseInt(generalDigits[1]);
        }
      }

      // Dynamic automatic earmarking (Select uncommitted assets to satisfy the goal)
      const committedSubAssetIds = new Set<string>();
      goals.forEach(g => {
        if (g.allocations) {
          g.allocations.forEach(a => committedSubAssetIds.add(a.subAssetId));
        }
      });

      // Find uncommitted sub assets
      const uncommittedList: { subId: string; assetId: string; value: number; growthRate: number; name: string }[] = [];
      assets.forEach((asset) => {
        if (asset.id === "ppf" || asset.id === "nps" || asset.id === "esops" || asset.id === "real_estate") return; // Keep PPF, NPS, ESOPs and Real Estate out of planning commitments
        asset.subAssets.forEach((sub) => {
          if (!committedSubAssetIds.has(sub.id)) {
            uncommittedList.push({
              subId: sub.id,
              assetId: asset.id,
              value: sub.value,
              growthRate: sub.growthRate,
              name: sub.name
            });
          }
        });
      });

      // Auto-earmark logic: Earmark subset of uncommitted sub-assets
      // Select preferred categories if possible
      let chosen = uncommittedList.filter(item => {
        if (category === "Buying a car") return item.assetId === "mutual_funds";
        if (category === "Buying a house") return item.assetId === "stocks" || item.assetId === "real_estate";
        if (category === "Planning a trip") return item.assetId === "crypto" || item.assetId === "stocks";
        return false;
      });

      if (chosen.length === 0) {
        // Fallback: take top 2 uncommitted assets of highest value
        chosen = [...uncommittedList].sort((a,b) => b.value - a.value).slice(0, 2);
      }

      const allocations = chosen.map(s => ({
        assetId: s.assetId,
        subAssetId: s.subId
      }));

      const currentCommitted = chosen.reduce((sum, item) => sum + item.value, 0);
      let nominalRate = 12; // default yield
      if (currentCommitted > 0) {
        const totalWeightedYield = chosen.reduce((sum, item) => sum + (item.value * item.growthRate), 0);
        nominalRate = totalWeightedYield / currentCommitted;
      }

      const realFutureValue = calculateFutureValue(
        currentCommitted,
        nominalRate,
        durationYears,
        true // subtract 6% inflation
      );

      const shortfallAmount = Math.max(0, targetAmount - realFutureValue);
      const achievedPercent = Math.min(100, (currentCommitted / targetAmount) * 100);

      // Create new goal record
      const newGoal: Goal = {
        id: `${category.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        category,
        title: goalTitle,
        iconName,
        targetAmount,
        durationYears,
        allocatedAssetId: chosen[0]?.assetId || "mutual_funds",
        allocatedSubAssetId: chosen.length === 1 ? chosen[0].subId : (chosen.length > 1 ? "multiple" : "none"),
        allocations,
        currentValueAllocated: currentCommitted,
        futureValueAllocated: realFutureValue,
        shortfall: shortfallAmount,
        achievedPercentage: achievedPercent,
        downPayment: targetAmount,
        loanAmount: 0,
      };

      onSaveGoal(newGoal);
      setSuccessResult({
        type: "goal",
        title: `Goal Added to life roadmap!`,
        description: `Your custom goal has been created. We've automatically earmarked ${chosen.length} uncommitted asset holdings to kickstart its planning.`,
        details: [
          { label: "Target Goal Type", value: category },
          { label: "Target Future Price", value: formatIndianCurrency(targetAmount) },
          { label: "Timeline Horizontal", value: `${durationYears} Years` },
          { label: "Auto-Allocated Cap", value: formatIndianCurrency(currentCommitted) },
        ],
      });

      // Switch to goals planning UI
      setActivePlanningTab("goals");
    }

    // Reset prompt input box
    setInputText("");
  };

  return (
    <div className="bg-white border border-slate-200/80 p-3 sm:p-4 rounded-3xl shadow-xs relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-brand-hover"></div>
      
      {/* AI suggested tag above the search bar */}
      <div className="flex items-center gap-1.5 mb-2.5 select-none self-start">
        <span className="bg-brand-light border border-brand/20 text-brand text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
          AI Suggested
        </span>
      </div>

      {/* Form Area */}
      <form onSubmit={handleParsePrompt} className="space-y-3">
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl shadow-3xs p-1 focus-within:bg-white focus-within:border-brand/70 focus-within:ring-2 focus-within:ring-brand/10 transition-all">
          
          {/* Sparkles Icon Inside Bar */}
          <div className="pl-3 pr-1 text-brand shrink-0 flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={samplePrompts[placeholderIndex]}
            className="w-full pl-0 pr-14 py-1.5 text-[11px] font-medium text-slate-800 bg-transparent outline-none border-none placeholder:text-slate-400 placeholder:italic placeholder:transition-all placeholder:duration-300"
          />
          
          <button
            type="submit"
            className="absolute right-1 p-2 bg-brand hover:bg-brand-hover text-white rounded-lg shadow-3xs hover:shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center"
            title="Submit natural phrase"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Click Samples Banner */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[9.5px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Try clicking sample text:</span>
          </span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => handleSelectSample("I want to retire by 52 with a monthly expense of 1.5 Lakhs")}
              className="text-[9.5px] bg-slate-50 text-slate-505 text-slate-500 hover:text-brand hover:bg-brand-light border border-slate-200 hover:border-brand/35 rounded-full px-2 py-0.5 font-medium cursor-pointer active:scale-95 transition-all"
            >
              "Retire by 52"
            </button>
            <button
              type="button"
              onClick={() => handleSelectSample("I want to buy a car in the next three years worth 20L")}
              className="text-[9.5px] bg-slate-50 text-slate-505 text-slate-500 hover:text-brand hover:bg-brand-light border border-slate-200 hover:border-brand/35 rounded-full px-2 py-0.5 font-medium cursor-pointer active:scale-95 transition-all"
            >
              "Buy a car worth 20L"
            </button>
          </div>
        </div>
      </form>

      {/* Notifications / Errors / Results overlay */}
      <AnimatePresence mode="wait">
        {errorText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-3.5 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-2xs font-semibold leading-normal"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </motion.div>
        )}

        {successResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mt-4 p-4 bg-white border border-emerald-200/90 rounded-2xl shadow-3xs flex flex-col md:flex-row gap-4 items-start md:items-center relative"
          >
            {/* Corner close button */}
            <button
              onClick={() => setSuccessResult(null)}
              className="absolute right-3.5 top-3.5 text-slate-300 hover:text-slate-500 font-mono text-3xs font-extrabold"
              title="Close indicator"
            >
              ✕
            </button>

            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="space-y-1 flex-1">
              <h5 className="text-emerald-900 text-xs font-bold flex items-center gap-1.5 leading-none">
                {successResult.title}
              </h5>
              <p className="text-slate-500 text-3xs font-medium leading-relaxed max-w-xl">
                {successResult.description}
              </p>
              
              {/* Detailed metrics output */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-3 mt-3 border-t border-slate-100">
                {successResult.details.map((item, index) => (
                  <div key={index} className="flex flex-col">
                    <span className="text-slate-400 text-[9px] font-extrabold uppercase tracking-wider">{item.label}</span>
                    <span className="text-slate-805 text-slate-900 text-2xs font-black font-sans shrink-0 block mt-0.5">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
