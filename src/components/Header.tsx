/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TrendingUp, Sparkles, RefreshCw, Smartphone } from "lucide-react";

interface HeaderProps {
  userName: string;
  userAge: number;
  onNavigate: (view: number) => void;
  activeView: number;
  onEditProfile: () => void;
}

export default function Header({ userName, userAge, onNavigate, activeView, onEditProfile }: HeaderProps) {
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">("idle");

  const handleSyncRef = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("synced");
      setTimeout(() => {
        setSyncStatus("idle");
      }, 2000);
    }, 1200);
  };

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shadow-xs font-sans">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Brand logo & user info */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => onNavigate(1)} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center shadow-md shadow-brand/10 group-hover:scale-105 transition-transform duration-200">
              <div className="w-4.5 h-4.5 bg-white rounded-xs rotate-45"></div>
            </div>
            <div>
              <span className="text-slate-900 font-extrabold text-lg tracking-tight group-hover:text-brand transition-colors duration-200">
                IND<span className="text-brand">money</span>
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 ml-2 px-2 py-0.5 rounded-full font-mono font-medium">
                Plan
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: navigation & metrics */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => onNavigate(1)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all duration-200 ${
                activeView === 1
                  ? "bg-white text-brand shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              id="nav-nav1-btn"
            >
              My net worth
            </button>
            <button
              onClick={() => onNavigate(2)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all duration-200 ${
                activeView === 2
                  ? "bg-white text-brand shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              id="nav-nav2-btn"
            >
              Financial goals
            </button>
          </div>

          <div 
            onClick={onEditProfile}
            className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-brand bg-brand-light hover:bg-brand/15 border border-brand/20 rounded-md py-1.5 px-2 sm:px-3 cursor-pointer transition-all active:scale-95 shadow-3xs"
            title="Click to edit profile & age"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand shrink-0 animate-pulse pointer-events-none" />
            <span className="font-semibold select-none">
              Profile: <span className="underline decoration-dotted underline-offset-2">{userName}</span>, age <b>{userAge}</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className={`p-2 border rounded-lg active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                syncStatus === "synced" 
                  ? "border-emerald-200 text-emerald-700 bg-emerald-50" 
                  : "text-slate-600 hover:text-slate-900 border-slate-200 bg-white hover:bg-slate-50"
              }`}
              title="Force sync live values"
              onClick={handleSyncRef}
              disabled={syncStatus === "syncing"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === "syncing" ? "animate-spin text-brand" : "text-slate-400"}`} />
              <span className="hidden sm:inline font-semibold">
                {syncStatus === "idle" && "Sync feed"}
                {syncStatus === "syncing" && "Syncing..."}
                {syncStatus === "synced" && "Synced!"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
