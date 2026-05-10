export interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  emoji: string;
  maxLevel: number;
  costPerLevel: number;
  effectLabel: (level: number) => string;
}

export const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  {
    id: "facility-reputation",
    name: "Facility Reputation",
    description: "Your brand commands premium pricing. Buyers pay more for known operators.",
    emoji: "⭐",
    maxLevel: 5,
    costPerLevel: 1,
    effectLabel: (lvl) => `+${lvl * 10}% sell price`,
  },
  {
    id: "veteran-staff",
    name: "Veteran Cultivation Staff",
    description: "Experienced growers optimize every plant. Retained across facility resets.",
    emoji: "👨‍🌾",
    maxLevel: 5,
    costPerLevel: 1,
    effectLabel: (lvl) => `+${lvl * 5}% yield`,
  },
  {
    id: "seed-bank",
    name: "Seed Bank Relationships",
    description: "Volume procurement deals reduce clone costs. Negotiated across runs.",
    emoji: "🧬",
    maxLevel: 3,
    costPerLevel: 1,
    effectLabel: (lvl) => `-${lvl * 10}% clone cost`,
  },
  {
    id: "ipm-protocol",
    name: "IPM SOP",
    description: "Standing pest management protocols reduce infestation risk each run.",
    emoji: "🛡️",
    maxLevel: 4,
    costPerLevel: 1,
    effectLabel: (lvl) => `-${(lvl * 0.5).toFixed(1)}% daily pest chance`,
  },
  {
    id: "investor-capital",
    name: "Investor Capital",
    description: "Track record attracts investment. Applied as starting funds each new run.",
    emoji: "💼",
    maxLevel: 5,
    costPerLevel: 1,
    effectLabel: (lvl) => `+$${(lvl * 500).toLocaleString()} starting funds`,
  },
];

export const PRESTIGE_THRESHOLD = 10_000;
export const PRESTIGE_POINTS_PER = 5_000;

export function prestigePointsAvailable(lifetimeEarnings: number): number {
  return Math.floor(lifetimeEarnings / PRESTIGE_POINTS_PER);
}

export function computeStartingMoney(prestigeUpgrades: Record<string, number>): number {
  return 2000 + (prestigeUpgrades["investor-capital"] ?? 0) * 500;
}

export function prestigeLevel(id: string, upgrades: Record<string, number>): number {
  return upgrades[id] ?? 0;
}
