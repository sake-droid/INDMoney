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
            </div>
          </div>
        </div>

        {/* Center/Right: navigation & metrics */}
        <div className="flex items-center gap-2 sm:gap-4">
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

          
        </div>
      </div>
    </header>
  );
}
