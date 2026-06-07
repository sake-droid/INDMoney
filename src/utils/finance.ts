/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssetCategory, SubAsset } from "../types";

/**
 * Format number to Indian Currency format with lacs & crores
 * e.g., ₹48.5 Lakh or ₹1.2 Crore
 */
export function formatIndianCurrency(amount: number, compact: boolean = false): string {
  if (amount === 0) return "₹0";
  
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (compact) {
    if (absAmount >= 10000000) {
      return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`;
    }
    if (absAmount >= 100000) {
      return `${sign}₹${(absAmount / 100000).toFixed(1)} L`;
    }
    if (absAmount >= 1000) {
      return `${sign}₹${(absAmount / 1000).toFixed(0)}K`;
    }
    return `${sign}₹${absAmount.toFixed(0)}`;
  }

  // Large standard Indian format
  if (absAmount >= 10000000) {
    return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    return `${sign}₹${(absAmount / 100000).toFixed(2)} Lakh`;
  } else {
    // Add commas according to standard Indian grouping (3,2,2)
    const amountStr = Math.floor(absAmount).toString();
    const lastThree = amountStr.substring(amountStr.length - 3);
    const otherNumbers = amountStr.substring(0, amountStr.length - 3);
    const withCommas = otherNumbers !== "" 
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
      : lastThree;
    return `${sign}₹${withCommas}`;
  }
}

/**
 * Calculates weighted average rate of return across all assets
 */
export function getWeightedAverageGrowth(assets: AssetCategory[]): number {
  let totalValue = 0;
  let totalWeightedReturn = 0;

  assets.forEach(asset => {
    totalValue += asset.totalValue;
    totalWeightedReturn += asset.totalValue * asset.averageGrowthRate;
  });

  return totalValue > 0 ? totalWeightedReturn / totalValue : 10;
}

/**
 * Calculate the Real Future Value of a committed Asset/Sub-Asset with 6% inflation
 * Formula: CurrentValue * (1 + NominalGrowth - 0.06)^Years
 */
export function calculateFutureValue(
  currentValue: number,
  nominalRate: number,
  years: number,
  includeInflation: boolean = true
): number {
  const rateFraction = nominalRate / 100;
  const inflationFraction = includeInflation ? 0.06 : 0;
  const effectiveRate = Math.max(0, rateFraction - inflationFraction);
  
  return currentValue * Math.pow(1 + effectiveRate, years);
}

/**
 * Project net worth year-by-year from any starting age up to target age
 */
export interface NetWorthDataPoint {
  age: number;
  year: number;
  nominalValue: number;
  realValue: number; // inflation-adjusted
}

export function projectNetWorth(
  startAge: number,
  endAge: number,
  initialWorth: number,
  growthRate: number
): NetWorthDataPoint[] {
  const points: NetWorthDataPoint[] = [];
  const currentYear = new Date().getFullYear();

  for (let age = startAge; age <= endAge; age++) {
    const yearsDiff = age - startAge;
    // Compounding at nominal rate
    const nominalValue = initialWorth * Math.pow(1 + growthRate / 100, yearsDiff);
    // Compounding at real rate (Growth - 6% inflation)
    const realGrowthRate = Math.max(0, growthRate - 6);
    const realValue = initialWorth * Math.pow(1 + realGrowthRate / 100, yearsDiff);

    points.push({
      age,
      year: currentYear + yearsDiff,
      nominalValue: Math.round(nominalValue),
      realValue: Math.round(realValue)
    });
  }

  return points;
}

/**
 * Calculates the monthly SIP (Systematic Investment Plan) amount required to close
 * a future deficit shortfall, adjusting for compound real (inflation-subtracted) yield.
 */
export function calculateMonthlySIP(shortfall: number, nominalRate: number, durationYears: number): number {
  if (shortfall <= 0 || durationYears <= 0) return 0;
  
  // Real annual rate (nominal - 6% inflation)
  const realAnnualRate = Math.max(0.1, nominalRate - 6);
  const r = (realAnnualRate / 100) / 12; // Monthly rate
  const n = durationYears * 12;          // Total months
  
  // Annuity formula: PMT = Shortfall * r / ((1 + r)^n - 1)
  const pmt = shortfall * r / (Math.pow(1 + r, n) - 1);
  return pmt;
}
