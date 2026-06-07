/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import NetWorthCard from "./components/NetWorthCard";
import AssetDistribution from "./components/AssetDistribution";
import Banner from "./components/Banner";
import NetWorthGraph from "./components/NetWorthGraph";
import GoalsPlanner from "./components/GoalsPlanner";
import RetirementPlanner from "./components/RetirementPlanner";
import GoalBottomSheet from "./components/GoalBottomSheet";
import NaturalLanguageBar from "./components/NaturalLanguageBar";
import SipSetupModal from "./components/SipSetupModal";

import { initialAssets, initialProfile } from "./data/mockData";
import { AssetCategory, Goal } from "./types";
import { getWeightedAverageGrowth, projectNetWorth } from "./utils/finance";
import { Landmark, CalendarDays, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  const [assets, setAssets] = useState<AssetCategory[]>(initialAssets);
  const [profile, setProfile] = useState(initialProfile);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  // SIP Setup modal state
  const [sipModalGoal, setSipModalGoal] = useState<Goal | null>(null);
  const [sipModalRecommended, setSipModalRecommended] = useState<number>(0);
  
  // Profile modal settings state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tempProfileName, setTempProfileName] = useState("");
  const [tempProfileAge, setTempProfileAge] = useState(25);
  const [tempProfileRetirementAge, setTempProfileRetirementAge] = useState(60);

  // Views navigation state
  // 1 = Home (My Net worth dashboard), 2 = Financial Goals & planning screen
  const [activeView, setActiveView] = useState<number>(1);
  const [activePlanningTab, setActivePlanningTab] = useState<"goals" | "retirement">("goals");

  // Track if user clicked on "Plan for Retirement" banner or navigated
  const [hasClickedBanner, setHasClickedBanner] = useState<boolean>(false);

  // Bottom Sheet parameters
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Buying a car");
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);

  // Load objects from localStorage on mount
  useEffect(() => {
    const savedAssets = localStorage.getItem("ind_assets");
    let currentAssets = initialAssets;
    if (savedAssets) {
      try {
        const parsedAssets = JSON.parse(savedAssets);
        setAssets(parsedAssets);
        currentAssets = parsedAssets;
      } catch (err) {
        console.error("Error loading cached assets", err);
      }
    }

    const savedGoals = localStorage.getItem("ind_goals");
    if (savedGoals) {
      try {
        const parsed = JSON.parse(savedGoals) as Goal[];
        const sanitized = parsed.map(g => {
          if (!g.allocations || g.allocations.length === 0) return g;
          const filteredAllocations = g.allocations.filter(al => al.assetId !== "ppf" && al.assetId !== "nps" && al.assetId !== "esops" && al.assetId !== "real_estate");
          if (filteredAllocations.length === g.allocations.length) return g;

          // Recompute values if some allocations were removed due to being PPF or NPS:
          const selectedSubAssetsList: { value: number; growthRate: number }[] = [];
          currentAssets.forEach((asset) => {
            asset.subAssets.forEach((sub) => {
              if (filteredAllocations.some(al => al.subAssetId === sub.id)) {
                selectedSubAssetsList.push(sub);
              }
            });
          });

          const currentValueAllocated = selectedSubAssetsList.reduce((sum, item) => sum + item.value, 0);
          let nominalRate = 12;
          if (currentValueAllocated > 0) {
            const totalWeightedYield = selectedSubAssetsList.reduce((sum, item) => sum + (item.value * item.growthRate), 0);
            nominalRate = totalWeightedYield / currentValueAllocated;
          }

          const realFutureValue = currentValueAllocated * Math.pow(1 + Math.max(0, (nominalRate / 100) - 0.06), g.durationYears);
          const shortfall = Math.max(0, g.targetAmount - realFutureValue);
          const achievedPercentage = Math.min(100, (currentValueAllocated / g.targetAmount) * 100);

          return {
            ...g,
            allocations: filteredAllocations,
            currentValueAllocated,
            futureValueAllocated: realFutureValue,
            shortfall,
            achievedPercentage,
            allocatedAssetId: filteredAllocations.length === 1 ? filteredAllocations[0].assetId : (filteredAllocations.length > 1 ? "multiple" : "none"),
            allocatedSubAssetId: filteredAllocations.length === 1 ? filteredAllocations[0].subAssetId : (filteredAllocations.length > 1 ? "multiple" : "none")
          };
        });

        setGoals(sanitized);
        localStorage.setItem("ind_goals", JSON.stringify(sanitized));
      } catch (err) {
        console.error("Error loading cached goals", err);
      }
    }

    const savedProfile = localStorage.getItem("ind_profile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (err) {
        console.error("Error loading cached profile", err);
      }
    }

    const savedBannerHistory = localStorage.getItem("ind_seen_banner");
    if (savedBannerHistory === "true") {
      setHasClickedBanner(true);
    }
  }, []);

  // Compute live portfolio metrics
  const totalNetWorth = assets.reduce((sum, item) => sum + item.totalValue, 0);
  const weightedGrowthRate = getWeightedAverageGrowth(assets);

  // Core update wrappers
  const handleUpdateAssets = (updatedAssets: AssetCategory[]) => {
    setAssets(updatedAssets);
    localStorage.setItem("ind_assets", JSON.stringify(updatedAssets));
  };

  const handleUpdateProfile = (updatedProfile: typeof profile) => {
    setProfile(updatedProfile);
    localStorage.setItem("ind_profile", JSON.stringify(updatedProfile));
  };

  const handleOpenProfileModal = () => {
    setTempProfileName(profile.name);
    setTempProfileAge(profile.currentAge);
    setTempProfileRetirementAge(profile.retirementAge);
    setIsProfileModalOpen(true);
  };

  // Compute banner 50 net worth projections dynamically using projectNetWorth
  const bannerTargetAge = Math.max(50, profile.currentAge >= 50 ? profile.currentAge + 10 : 50);
  const bannerPoints = projectNetWorth(profile.currentAge, bannerTargetAge, totalNetWorth, weightedGrowthRate);
  const bannerPoint = bannerPoints.find((p) => p.age === bannerTargetAge) || { nominalValue: totalNetWorth, realValue: totalNetWorth };

  // Navigation handlers
  const handleNavigateToPlanning = (tab: "goals" | "retirement" = "goals") => {
    setHasClickedBanner(true);
    localStorage.setItem("ind_seen_banner", "true");
    setActiveView(2);
    setActivePlanningTab(tab);
  };

  // Bottom Sheet handlers
  const handleSelectGoalCategory = (category: string) => {
    setEditingGoal(undefined);
    setSelectedCategory(category);
    setIsBottomSheetOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setSelectedCategory(goal.category);
    setIsBottomSheetOpen(true);
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    localStorage.setItem("ind_goals", JSON.stringify(updated));
  };

  const handleSaveGoal = (goal: Goal) => {
    let updated: Goal[];
    const exists = goals.some((g) => g.id === goal.id);

    if (exists) {
      updated = goals.map((g) => (g.id === goal.id ? goal : g));
    } else {
      updated = [goal, ...goals]; // Newest goals first
    }

    setGoals(updated);
    localStorage.setItem("ind_goals", JSON.stringify(updated));
  };

  const handleConfirmSip = (goalId: string, amount: number) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        return { ...g, activeSipAmount: amount };
      }
      return g;
    });
    setGoals(updated);
    localStorage.setItem("ind_goals", JSON.stringify(updated));
  };

  const handleStartSip = (goal: Goal, recommendedAmount: number) => {
    setSipModalGoal(goal);
    setSipModalRecommended(recommendedAmount);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-brand-light selection:text-brand">
      
      {/* 1. Header Navigation */}
      <Header
        userName={profile.name}
        userAge={profile.currentAge}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onEditProfile={handleOpenProfileModal}
      />

      {/* 2. Main Container View */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-8 pb-16">
        
        {/* ==================== SCREEN 1: PORTFOLIO & SUMMARY ==================== */}
        {activeView === 1 && (
          <div className="space-y-6">
            
            {/* Net Worth bold card display */}
            <NetWorthCard 
              totalValue={totalNetWorth} 
              averageGrowth={weightedGrowthRate} 
            />

            {/* Dynamic Banner: Disappears once clicked & returns */}
            <Banner
              hasClickedBanner={hasClickedBanner}
              onNavigateToPlanning={() => handleNavigateToPlanning("goals")}
              nominalWorthAt50={bannerPoint.nominalValue}
              realWorthAt50={bannerPoint.realValue}
              targetAge={bannerTargetAge}
            />

            {/* Flat Asset weight list distribution */}
            <AssetDistribution 
              assets={assets} 
              totalNetWorth={totalNetWorth} 
              onUpdateAssets={handleUpdateAssets}
            />
            
          </div>
        )}

        {/* ==================== SCREEN 2: FINANCIAL PLANNING GRAPH & PLANNER ==================== */}
        {activeView === 2 && (
          <div className="space-y-8">
            
            {/* Adaptive projections graph showing Nominals & inflation adjustments */}
            <NetWorthGraph
              currentAge={profile.currentAge}
              retirementAge={profile.retirementAge}
              initialNetWorth={totalNetWorth}
              weightedGrowthRate={weightedGrowthRate}
            />

            {/* Copilot Natural Language bar for goals & retirement */}
            <NaturalLanguageBar
              goals={goals}
              assets={assets}
              profile={profile}
              onSaveGoal={handleSaveGoal}
              onUpdateProfile={handleUpdateProfile}
              setActivePlanningTab={setActivePlanningTab}
            />

            {/* Selector Toggles (Goals vs Retirement side-by-side) */}
            <div className="border-b border-slate-200 pb-px">
              <div className="flex gap-6">
                <button
                  onClick={() => setActivePlanningTab("goals")}
                  className={`pb-4 text-sm font-bold select-none cursor-pointer relative transition-all duration-200 ${
                    activePlanningTab === "goals"
                      ? "text-brand font-black"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  id="tab-goals-trigger"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 pointer-events-none text-brand" />
                    Life goals earmarking
                  </span>
                  {activePlanningTab === "goals" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand"></span>
                  )}
                </button>

                <button
                  onClick={() => setActivePlanningTab("retirement")}
                  className={`pb-4 text-sm font-bold select-none cursor-pointer relative transition-all duration-200 ${
                    activePlanningTab === "retirement"
                      ? "text-brand font-black"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  id="tab-retirement-trigger"
                >
                  <span className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 pointer-events-none text-slate-500" />
                    Retirement planning
                  </span>
                  {activePlanningTab === "retirement" && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Conditional Sub-panels */}
            {activePlanningTab === "goals" ? (
              <GoalsPlanner
                goals={goals}
                assets={assets}
                onSelectCategory={handleSelectGoalCategory}
                onEditGoal={handleEditGoal}
                onDeleteGoal={handleDeleteGoal}
                onStartSip={handleStartSip}
              />
            ) : (
              <RetirementPlanner 
                assets={assets} 
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                />
              )}
  
            </div>
          )}
  
        </main>
  
        {/* 3. Global custom bottom sheet modal */}
        <GoalBottomSheet
          isOpen={isBottomSheetOpen}
          onClose={() => setIsBottomSheetOpen(false)}
          category={selectedCategory}
          assets={assets}
          onSaveGoal={handleSaveGoal}
          editingGoal={editingGoal}
          goals={goals}
        />

        {/* 4. Global interactive Profile & Age customization modal */}
        {isProfileModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div 
              className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              id="profile-customizer-modal"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse"></span>
                  <h3 className="text-slate-900 font-bold text-sm tracking-tight">Edit user profile setting</h3>
                </div>
                <button 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-450 hover:text-slate-705 transition-colors cursor-pointer text-xs font-bold font-mono"
                >
                  ✕
                </button>
              </div>

              {/* Fields */}
              <div className="p-5 space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    value={tempProfileName}
                    onChange={(e) => setTempProfileName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-brand rounded-xl text-xs font-semibold text-slate-800 outline-none transition-all"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Current Age */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Current Age</label>
                    <input
                      type="number"
                      value={tempProfileAge}
                      onChange={(e) => setTempProfileAge(parseInt(e.target.value) || 25)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-brand rounded-xl text-xs font-semibold text-slate-850 outline-none transition-all font-sans"
                      min="1"
                      max="100"
                    />
                  </div>

                  {/* Retirement Age */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Retirement Target</label>
                    <input
                      type="number"
                      value={tempProfileRetirementAge}
                      onChange={(e) => setTempProfileRetirementAge(parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-brand rounded-xl text-xs font-semibold text-slate-850 outline-none transition-all font-sans"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-450 text-slate-500 italic leading-relaxed">
                  * Adjusting your age or retirement timeline dynamically updates all real-time compounding projection curves and life planning goals.
                </p>
              </div>

              {/* Actions */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-150 flex justify-end gap-2.5">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-800 border border-slate-200 rounded-xl cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateProfile({
                      name: tempProfileName,
                      currentAge: tempProfileAge,
                      retirementAge: tempProfileRetirementAge,
                      targetRetirementCorpus: profile.targetRetirementCorpus
                    });
                    setIsProfileModalOpen(false);
                  }}
                  className="px-4.5 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Start Goal Auto-SIP Link Bank mandate Model popup */}
        {sipModalGoal && (
          <SipSetupModal
            goal={sipModalGoal}
            defaultAmount={sipModalRecommended}
            onClose={() => setSipModalGoal(null)}
            onConfirmSip={handleConfirmSip}
          />
        )}
  
        {/* Footer Branding Info */}
        <footer className="border-t border-slate-250 border-slate-200 bg-white py-6 mt-auto">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-3xs text-slate-450 text-slate-500 font-mono">
            <span>INDmoney prototype engine co.</span>
            <span>© 2026 Inflation and reconciliation benchmark index</span>
          </div>
        </footer>

    </div>
  );
}
