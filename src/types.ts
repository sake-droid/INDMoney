/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubAsset {
  id: string;
  name: string;
  value: number;
  growthRate: number; // e.g. 13 for 13%
}

export interface AssetCategory {
  id: string;
  name: string;
  iconName: string;
  totalValue: number;
  averageGrowthRate: number;
  subAssets: SubAsset[];
  color: string; // for UI pills and highlights
}

export interface EarmarkedAllocation {
  assetId: string;
  subAssetId: string; // 'all' or specific sub-asset ID
}

export interface Goal {
  id: string;
  category: string; // 'Buying a car', 'planning a trip', 'Buying a house', 'Getting Married', 'Custom'
  title: string;
  iconName: string;
  targetAmount: number; // in today's terms
  durationYears: number;
  allocatedAssetId: string; // e.g. 'mutual_funds' or 'stocks' (main asset fallback)
  allocatedSubAssetId: string; // 'all' or specific sub-asset ID (main sub-asset fallback)
  allocations: EarmarkedAllocation[]; // Array of multiple earmarked asset/sub-assets
  currentValueAllocated: number;
  futureValueAllocated: number; // inflation-adjusted future value
  shortfall: number;
  achievedPercentage: number;
}

export interface UserProfile {
  name: string;
  currentAge: number;
  retirementAge: number;
  targetRetirementCorpus: number; // default: 10,00,00,000 (10 Cr)
}
