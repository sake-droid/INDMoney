/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { AssetCategory } from "../types";
import { formatIndianCurrency } from "../utils/finance";

interface AssetDistributionProps {
  assets: AssetCategory[];
  totalNetWorth: number;
  onUpdateAssets: (updatedAssets: AssetCategory[]) => void;
}

export default function AssetDistribution({ assets, totalNetWorth, onUpdateAssets }: AssetDistributionProps) {
  const [expandedAssetIds, setExpandedAssetIds] = useState<string[]>([]);
  
  // Track currently active inline editing states
  const [editingSubAssetId, setEditingSubAssetId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editValue, setEditValue] = useState<string>("");
  const [editGrowth, setEditGrowth] = useState<string>("");

  const startEditing = (sub: { id: string; name: string; value: number; growthRate: number }, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingSubAssetId(sub.id);
    setEditName(sub.name);
    setEditValue(sub.value.toString());
    setEditGrowth(sub.growthRate.toString());
  };

  const cancelEditing = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingSubAssetId(null);
  };

  const saveSubAssetEdit = (assetId: string, subId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const valFloat = parseFloat(editValue) || 0;
    const growthFloat = parseFloat(editGrowth) || 0;
    
    const updated = assets.map((asset) => {
      if (asset.id !== assetId) return asset;
      
      const updatedSubs = asset.subAssets.map((sub) => {
        if (sub.id !== subId) return sub;
        return { ...sub, name: editName, value: valFloat, growthRate: growthFloat };
      });
      
      const newTotalValue = updatedSubs.reduce((sum, s) => sum + s.value, 0);
      const newWeightedGrowth = newTotalValue > 0
        ? Number((updatedSubs.reduce((sum, s) => sum + s.value * s.growthRate, 0) / newTotalValue).toFixed(2))
        : asset.averageGrowthRate;
        
      return {
        ...asset,
        subAssets: updatedSubs,
        totalValue: newTotalValue,
        averageGrowthRate: newWeightedGrowth,
      };
    });
    
    onUpdateAssets(updated);
    setEditingSubAssetId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-slate-900 text-lg font-bold tracking-tight">Portfolio asset allocation</h3>
          <p className="text-slate-500 text-xs mt-1">
            Breakdown of active capital holdings. Click any asset class below to audit individual fund instruments.
          </p>
        </div>
        <span className="self-start sm:self-center text-xs font-bold text-brand bg-brand-light px-3 py-1 rounded-lg border border-brand/10">
          {assets.length} active asset classes
        </span>
      </div>

      {/* Main distribution grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        {assets.map((asset) => {
          const percentage = ((asset.totalValue / totalNetWorth) * 100);
          
          // Dynamically obtain icon
          let IconComponent = Icons.HelpCircle;
          if (asset.iconName in Icons) {
            IconComponent = (Icons as any)[asset.iconName];
          }

          const isExpanded = expandedAssetIds.includes(asset.id);

          return (
            <div 
              key={asset.id}
              className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden transition-all duration-200 shadow-3xs hover:shadow-2xs group"
            >
              {/* Header section toggleable */}
              <div 
                onClick={() => toggleExpand(asset.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none active:bg-slate-100/60"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center border transition-colors group-hover:scale-105 duration-200"
                    style={{ 
                      backgroundColor: `${asset.color}15`, 
                      borderColor: `${asset.color}35`,
                      color: asset.color
                    }}
                  >
                    <IconComponent className="w-5 h-5 pointer-events-none" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-900 text-sm font-bold block truncate tracking-tight group-hover:text-brand transition-colors">
                      {asset.name}
                    </span>
                    <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1.5 mt-0.5">
                      <span>{percentage.toFixed(1)}% weight</span>
                      <span className="text-slate-300 font-normal">•</span>
                      <span className="text-brand font-bold">{asset.averageGrowthRate}% p.a.</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-slate-900 text-md font-extrabold block font-sans">
                      {formatIndianCurrency(asset.totalValue)}
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:border-slate-300 shadow-3xs transition-all pointer-events-none">
                    {isExpanded ? (
                      <Icons.ChevronUp className="w-4 h-4" />
                    ) : (
                      <Icons.ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsed view element weight bar */}
              <div className="h-1 bg-slate-200 w-full relative">
                <div 
                  className="h-full absolute left-0 top-0 transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: asset.color
                  }}
                ></div>
              </div>

              {/* Nested Sub-assets breakdown with animation */}
              {isExpanded && (
                <div className="bg-slate-100/50 border-t border-slate-200/80 p-4 space-y-3">
                  <div className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1 select-none">
                    Asset composition & product allocation
                  </div>
                  
                  <div className="space-y-2">
                    {asset.subAssets.map((sub) => {
                      const subPercent = ((sub.value / asset.totalValue) * 100);
                      const isEditingThisSub = editingSubAssetId === sub.id;

                      if (isEditingThisSub) {
                        return (
                          <div 
                            key={sub.id}
                            className="bg-brand-light/30 p-3.5 rounded-xl border border-brand/20 shadow-3xs space-y-3"
                          >
                            <div className="text-[10px] uppercase tracking-wider font-extrabold text-brand flex items-center gap-1">
                              <Icons.Sliders className="w-3.5 h-3.5" />
                              <span>Editing allocation figures</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Name input */}
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold block">Asset Name / Instrument</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-brand outline-none"
                                />
                              </div>

                              {/* Value input */}
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold block">Current Value (₹)</label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs select-none">₹</span>
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-brand outline-none font-sans"
                                    min="0"
                                  />
                                </div>
                              </div>

                              {/* CAGR input */}
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold block">Compounding Yield CAGR (%)</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editGrowth}
                                    onChange={(e) => setEditGrowth(e.target.value)}
                                    className="w-full pl-2.5 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-brand outline-none font-sans"
                                    min="0"
                                    max="100"
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs select-none">% p.a.</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1 border-t border-brand/10">
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1.5 text-3xs font-extrabold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Icons.X className="w-3 h-3 shrink-0" />
                                <span>Cancel</span>
                              </button>
                              <button
                                onClick={(e) => saveSubAssetEdit(asset.id, sub.id, e)}
                                className="px-3.5 py-1.5 text-3xs font-extrabold text-white bg-brand hover:bg-brand-hover rounded-lg active:scale-95 transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                              >
                                <Icons.Check className="w-3 h-3 shrink-0" />
                                <span>Save changes</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={sub.id}
                          className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/60 shadow-3xs hover:border-brand/20 transition-all duration-200 group/item"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-slate-850 text-slate-800 text-xs font-extrabold truncate flex items-center gap-1.5">
                              {sub.name}
                            </span>
                            <span className="text-slate-500 text-[10.5px] font-semibold mt-0.5">
                              Fractional weight: <b className="text-slate-705 text-slate-700">{subPercent.toFixed(0)}%</b> • CAGR CAGR: <b className="text-brand">{sub.growthRate}% p.a.</b>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right text-slate-900 text-xs font-black font-sans">
                              {formatIndianCurrency(sub.value)}
                            </div>
                            
                            <button
                              onClick={(e) => startEditing(sub, e)}
                              className="opacity-0 group-hover/item:opacity-100 focus:opacity-100 p-1.5 rounded-md bg-slate-50 hover:bg-brand hover:text-white border border-slate-200 hover:border-brand text-slate-400 cursor-pointer active:scale-90 transition-all shadow-3xs"
                              title="Edit figure values"
                            >
                              <Icons.Edit3 className="w-3 h-3 pointer-events-none" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
