import type { Strain } from "./types";

export const STRAINS: Strain[] = [
  // ── Easy ──────────────────────────────────────────────────────────────────────
  {
    id: "blue-dream",
    name: "Blue Dream",
    description: "High-volume sativa hybrid with the best yield-to-cycle ratio in the catalog. Forgiving canopy tolerates less experienced crews. The throughput play.",
    cloneCost: 50,
    baseYieldGrams: 65,
    pricePerGram: 7,
    stageDurations: { germination: 2, seedling: 5, vegetative: 17, flowering: 28 },
    difficulty: "easy",
    emoji: "🫐",
    thcPercent: 19,
  },
  {
    id: "lemon-cherry-gelato",
    name: "Lemon Cherry Gelato",
    description: "Commercial workhorse. Fast finishing, consistent canopy, high terpene expression. Reliable choice for steady throughput.",
    cloneCost: 75,
    baseYieldGrams: 50,
    pricePerGram: 9,
    stageDurations: { germination: 3, seedling: 7, vegetative: 21, flowering: 34 },
    difficulty: "easy",
    emoji: "🍋",
    thcPercent: 22,
  },
  {
    id: "purple-punch",
    name: "Purple Punch",
    description: "Fast-finishing indica dominant with a short veg window. Lower wholesale rate offset by quick turnaround — ideal for filling gaps between premium runs.",
    cloneCost: 85,
    baseYieldGrams: 60,
    pricePerGram: 8,
    stageDurations: { germination: 3, seedling: 7, vegetative: 15, flowering: 30 },
    difficulty: "easy",
    emoji: "🍇",
    thcPercent: 20,
  },

  // ── Medium ────────────────────────────────────────────────────────────────────
  {
    id: "og-kush",
    name: "OG Kush",
    description: "Heritage genetics with sustained dispensary demand. Dense resinous buds. Long flower window requires commitment, but brand loyalty from retail buyers justifies it.",
    cloneCost: 110,
    baseYieldGrams: 50,
    pricePerGram: 11,
    stageDurations: { germination: 3, seedling: 9, vegetative: 22, flowering: 42 },
    difficulty: "medium",
    emoji: "🌿",
    thcPercent: 24,
  },
  {
    id: "wedding-cake",
    name: "Wedding Cake",
    description: "Top dispensary shelf cultivar. Dense, resinous buds with strong vanilla-pepper terpene profile. Solid wholesale demand.",
    cloneCost: 125,
    baseYieldGrams: 70,
    pricePerGram: 11,
    stageDurations: { germination: 3, seedling: 10, vegetative: 28, flowering: 39 },
    difficulty: "medium",
    emoji: "🎂",
    thcPercent: 24,
  },
  {
    id: "zkittlez",
    name: "Zkittlez",
    description: "Award-winning terpene profile with strong shelf appeal and above-average bulk. The sweet spot for facilities scaling into the mid-tier market.",
    cloneCost: 160,
    baseYieldGrams: 80,
    pricePerGram: 11,
    stageDurations: { germination: 3, seedling: 10, vegetative: 25, flowering: 38 },
    difficulty: "medium",
    emoji: "🍬",
    thcPercent: 22,
  },

  // ── Hard ──────────────────────────────────────────────────────────────────────
  {
    id: "runtz",
    name: "Runtz",
    description: "Prestige cultivar with top-shelf pricing and strong brand recognition. High maintenance requirements, but commands a premium in any market.",
    cloneCost: 200,
    baseYieldGrams: 75,
    pricePerGram: 13,
    stageDurations: { germination: 3, seedling: 12, vegetative: 29, flowering: 42 },
    difficulty: "hard",
    emoji: "🍭",
    thcPercent: 26,
  },
  {
    id: "gary-payton",
    name: "Gary Payton",
    description: "Ultra-premium, limited-run cultivar. Commands top-of-market pricing. Sensitive to environment — requires experienced hands.",
    cloneCost: 250,
    baseYieldGrams: 100,
    pricePerGram: 15,
    stageDurations: { germination: 4, seedling: 14, vegetative: 35, flowering: 42 },
    difficulty: "hard",
    emoji: "🏆",
    thcPercent: 28,
  },
  {
    id: "mac-1",
    name: "MAC 1",
    description: "Proprietary elite clone — highest wholesale rate in the catalog. Extremely long cycle and sensitive genetics. Not for the impatient.",
    cloneCost: 400,
    baseYieldGrams: 60,
    pricePerGram: 20,
    stageDurations: { germination: 4, seedling: 14, vegetative: 42, flowering: 48 },
    difficulty: "hard",
    emoji: "⚗️",
    thcPercent: 30,
  },
];

export function getStrain(id: string): Strain {
  const strain = STRAINS.find((s) => s.id === id);
  if (!strain) throw new Error(`Unknown strain: ${id}`);
  return strain;
}

export function getTotalGrowDays(strain: Strain): number {
  const { germination, seedling, vegetative, flowering } = strain.stageDurations;
  return germination + seedling + vegetative + flowering;
}
