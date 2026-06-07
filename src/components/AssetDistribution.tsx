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
}

export default function AssetDistribution({ assets, totalNetWorth }: AssetDistributionProps) {
  const [expandedAssetIds, setExpandedAssetIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    if (expandedAssetIds.includes(id)) {
      setExpandedAssetIds(expandedAssetIds.filter((item) => item !== id));
    } else {
      setExpandedAssetIds([...expandedAssetIds, id]);
    }
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
                      return (
                        <div 
                          key={sub.id}
                          className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/60 shadow-3xs hover:border-brand/20 transition-all duration-200"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-800 text-xs font-bold truncate">
                              {sub.name}
                            </span>
                            <span className="text-slate-500 text-[10.5px] font-semibold mt-0.5">
                              Fractional weight: <b className="text-slate-700">{subPercent.toFixed(0)}%</b> • CAGR growth rate: <b className="text-brand">{sub.growthRate}%</b>
                            </span>
                          </div>
                          
                          <div className="text-right text-slate-900 text-xs font-bold font-sans">
                            {formatIndianCurrency(sub.value)}
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
