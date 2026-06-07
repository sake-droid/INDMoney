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

import { initialAssets, initialProfile } from "./data/mockData";
import { AssetCategory, Goal } from "./types";
import { getWeightedAverageGrowth } from "./utils/finance";
import { Landmark, CalendarDays, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  const [assets, setAssets] = useState<AssetCategory[]>(initialAssets);
  const [profile, setProfile] = useState(initialProfile);
  const [goals, setGoals] = useState<Goal[]>([]);
  
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

  // Load goals and clicked history from localStorage on mount
  useEffect(() => {
    const savedGoals = localStorage.getItem("ind_goals");
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (err) {
        console.error("Error loading cached goals", err);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-brand-light selection:text-brand">
      
      {/* 1. Header Navigation */}
      <Header
        userName={profile.name}
        userAge={profile.currentAge}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
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
              onNavigateToPlanning={() => handleNavigateToPlanning("retirement")}
            />

            {/* Flat Asset weight list distribution */}
            <AssetDistribution 
              assets={assets} 
              totalNetWorth={totalNetWorth} 
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
              />
            ) : (
              <RetirementPlanner 
                assets={assets} 
                currentAge={profile.currentAge} 
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
