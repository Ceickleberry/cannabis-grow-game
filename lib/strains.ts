import type { Strain } from "./types";

export const STRAINS: Strain[] = [
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
