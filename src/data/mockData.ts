/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssetCategory } from "../types";

export const initialAssets: AssetCategory[] = [
  {
    id: "stocks",
    name: "Stocks",
    iconName: "TrendingUp",
    totalValue: 1500000,
    averageGrowthRate: 14.5,
    color: "#00e676", // high-tech neon green
    subAssets: [
      { id: "st-1", name: "HDFC Bank (Bluechip)", value: 650000, growthRate: 12.5 },
      { id: "st-2", name: "US Tech Portfolio (MNC)", value: 500000, growthRate: 16.5 },
      { id: "st-3", name: "Reliance Industries", value: 350000, growthRate: 15.0 }
    ]
  },
  {
    id: "mutual_funds",
    name: "Mutual Funds",
    iconName: "PieChart",
    totalValue: 1500000,
    averageGrowthRate: 12.8,
    color: "#00b0ff", // brilliant teal/blue
    subAssets: [
      { id: "mf-1", name: "Parag Parikh Flexi Cap", value: 600000, growthRate: 13.5 },
      { id: "mf-2", name: "Quant Active Direct Multi", value: 500000, growthRate: 14.2 },
      { id: "mf-3", name: "Mirae Asset Large Cap Fund", value: 400000, growthRate: 10.0 }
    ]
  },
  {
    id: "nps",
    name: "NPS",
    iconName: "Shield",
    totalValue: 350000,
    averageGrowthRate: 9.5,
    color: "#ff9100", // elegant orange
    subAssets: [
      { id: "np-1", name: "NPS Tier 1 - Equity (E)", value: 250000, growthRate: 10.5 },
      { id: "np-2", name: "NPS Tier 1 - Corp Debt (C)", value: 100000, growthRate: 7.0 }
    ]
  },
  {
    id: "ppf",
    name: "PPF",
    iconName: "Lock",
    totalValue: 400000,
    averageGrowthRate: 7.1,
    color: "#e040fb", // beautiful pink
    subAssets: [
      { id: "ppf-1", name: "Public Provident Fund", value: 400000, growthRate: 7.1 }
    ]
  },
  {
    id: "crypto",
    name: "Crypto",
    iconName: "Coins",
    totalValue: 200000,
    averageGrowthRate: 18.0,
    color: "#ffd600", // warm gold
    subAssets: [
      { id: "cr-1", name: "Bitcoin (BTC)", value: 150000, growthRate: 18.0 },
      { id: "cr-2", name: "Ethereum (ETH)", value: 50000, growthRate: 18.0 }
    ]
  },
  {
    id: "esops",
    name: "ESOPs",
    iconName: "Briefcase",
    totalValue: 400000,
    averageGrowthRate: 15.0,
    color: "#76ff03", // light lime green
    subAssets: [
      { id: "es-1", name: "Unvested Option Grant", value: 250000, growthRate: 15.0 },
      { id: "es-2", name: "Vested & Exercisable Pool", value: 150000, growthRate: 15.0 }
    ]
  },
  {
    id: "real_estate",
    name: "Real Estate",
    iconName: "Home",
    totalValue: 500000,
    averageGrowthRate: 8.5,
    color: "#ff5252", // beautiful red-orange
    subAssets: [
      { id: "re-1", name: "REIT - Embassy Office Parks", value: 300000, growthRate: 8.0 },
      { id: "re-2", name: "Fractional Tech Park Share", value: 200000, growthRate: 9.25 }
    ]
  }
];

export const initialProfile = {
  name: "Bhavik Gupta",
  currentAge: 25,
  retirementAge: 60,
  targetRetirementCorpus: 100000000, // 10 Cr (10,00,00,000)
  monthlyExpenses: 50000 // Default 50,000 INR
};
