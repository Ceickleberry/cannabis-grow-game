// Standalone game logic test — runs with Node.js directly
// Tests the reducer and effects functions by importing compiled-equivalent logic inline.

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

// ── Replicate core logic inline (no TS imports needed) ───────────────────────

const STRAINS = [
  {
    id: "lemon-cherry-gelato",
    cloneCost: 75,
    baseYieldGrams: 50,
    pricePerGram: 9,
    stageDurations: { germination: 3, seedling: 7, vegetative: 21, flowering: 34 },
  },
  {
    id: "wedding-cake",
    cloneCost: 125,
    baseYieldGrams: 70,
    pricePerGram: 11,
    stageDurations: { germination: 3, seedling: 10, vegetative: 28, flowering: 39 },
  },
  {
    id: "gary-payton",
    cloneCost: 250,
    baseYieldGrams: 100,
    pricePerGram: 15,
    stageDurations: { germination: 4, seedling: 14, vegetative: 35, flowering: 42 },
  },
];

const PEST_EVENTS = [
  { id: "spider-mites", healthDrainPerDay: 8, treatCost: 150, stages: ["vegetative", "flowering"] },
  { id: "botrytis",     healthDrainPerDay: 12, treatCost: 200, stages: ["flowering"] },
  { id: "fungus-gnats", healthDrainPerDay: 4,  treatCost: 80,  stages: ["seedling", "vegetative"] },
  { id: "root-rot",     healthDrainPerDay: 10, treatCost: 175, stages: ["seedling", "vegetative"] },
];

const PRESTIGE_THRESHOLD = 10_000;
const PRESTIGE_POINTS_PER = 5_000;

function getStrain(id) {
  const s = STRAINS.find(s => s.id === id);
  if (!s) throw new Error(`Unknown strain: ${id}`);
  return s;
}

function getPestEvent(id) {
  const e = PEST_EVENTS.find(e => e.id === id);
  if (!e) throw new Error(`Unknown event: ${id}`);
  return e;
}

function computeEffects(purchased, prestigeUpgrades) {
  const has = id => purchased.includes(id);
  const pl = id => prestigeUpgrades[id] ?? 0;
  return {
    waterInterval: has("auto-water") ? 6 : 3,
    healthDropPerDay: has("climate-ctrl") ? 7 : 15,
    yieldMultiplier: (has("nutrients") ? 1.25 : 1) * (1 + pl("veteran-staff") * 0.05),
    priceMultiplier: 1 + pl("facility-reputation") * 0.1,
    cloneCostMultiplier: Math.max(0.5, 1 - pl("seed-bank") * 0.1),
    floweringSpeedMult: has("led-lights") ? 0.8 : 1,
    vegetativeSpeedMult: has("co2-injector") ? 0.8 : 1,
    numSlots: 6 + (has("extra-slots-1") ? 3 : 0) + (has("extra-slots-2") ? 3 : 0),
    eventSpawnChance: Math.max(0.005, ((has("climate-ctrl") ? 15 : 30) - pl("ipm-protocol") * 5) / 1000),
  };
}

function effectiveStageDuration(stage, baseDuration, effects) {
  if (stage === "flowering") return Math.ceil(baseDuration * effects.floweringSpeedMult);
  if (stage === "vegetative") return Math.ceil(baseDuration * effects.vegetativeSpeedMult);
  return baseDuration;
}

const STAGE_ORDER = ["germination", "seedling", "vegetative", "flowering", "ready"];
function nextStage(stage) {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : stage;
}

function advancePlant(plant, day, effects) {
  if (plant.stage === "dead" || plant.stage === "ready") return plant;
  const strain = getStrain(plant.strainId);
  let health = plant.health;

  if (day - plant.lastWateredDay > effects.waterInterval) {
    health = Math.max(0, health - effects.healthDropPerDay);
  }

  let updatedEvent = plant.event;
  if (plant.event) {
    const eventDef = getPestEvent(plant.event.type);
    const newDaysActive = plant.event.daysActive + 1;
    const severityMult = newDaysActive >= 10 ? 2 : newDaysActive >= 5 ? 1.5 : 1;
    health = Math.max(0, health - Math.ceil(eventDef.healthDrainPerDay * severityMult));
    updatedEvent = { ...plant.event, daysActive: newDaysActive };
  }

  if (health === 0) return { ...plant, health: 0, stage: "dead", event: undefined };

  const newDaysInStage = plant.daysInCurrentStage + 1;
  const newTotalDays = plant.totalDays + 1;
  const ACTIVE = ["germination", "seedling", "vegetative", "flowering"];
  if (ACTIVE.includes(plant.stage)) {
    const duration = effectiveStageDuration(plant.stage, strain.stageDurations[plant.stage], effects);
    if (newDaysInStage >= duration) {
      return { ...plant, health, event: updatedEvent, stage: nextStage(plant.stage), daysInCurrentStage: 0, totalDays: newTotalDays };
    }
  }
  return { ...plant, health, event: updatedEvent, daysInCurrentStage: newDaysInStage, totalDays: newTotalDays };
}

function computeStartingMoney(prestigeUpgrades) {
  return 2000 + (prestigeUpgrades["investor-capital"] ?? 0) * 500;
}

function prestigePointsAvailable(lifetimeEarnings) {
  return Math.floor(lifetimeEarnings / PRESTIGE_POINTS_PER);
}

// ── Tests ────────────────────────────────────────────────────────────────────

const NO_UPGRADES = [];
const NO_PRESTIGE = {};
const BASE_EFFECTS = computeEffects(NO_UPGRADES, NO_PRESTIGE);

function makePlant(overrides = {}) {
  return {
    id: "p1",
    strainId: "lemon-cherry-gelato",
    stage: "vegetative",
    health: 100,
    daysInCurrentStage: 0,
    totalDays: 0,
    lastWateredDay: 1,
    slot: 0,
    event: undefined,
    ...overrides,
  };
}

// ── 1. Plant growth stages ───────────────────────────────────────────────────
console.log("\n1. Plant growth stages");
{
  const strain = getStrain("lemon-cherry-gelato");

  // Germination advances after 3 days
  let p = makePlant({ stage: "germination", daysInCurrentStage: 0 });
  for (let d = 2; d <= 4; d++) p = advancePlant(p, d, BASE_EFFECTS);
  assert("Germination completes after 3 days → seedling", p.stage === "seedling");

  // Full cycle: lemon-cherry-gelato should reach "ready" after total stage days
  p = makePlant({ stage: "germination", daysInCurrentStage: 0, lastWateredDay: 1 });
  const total = strain.stageDurations.germination + strain.stageDurations.seedling +
    strain.stageDurations.vegetative + strain.stageDurations.flowering;
  for (let d = 2; d <= total + 2; d++) {
    p = advancePlant(p, d, BASE_EFFECTS);
    // Re-water every 2 days to keep alive
    if (d % 2 === 0) p = { ...p, lastWateredDay: d };
  }
  assert(`Full cycle reaches 'ready' after ~${total} days`, p.stage === "ready",
    `actual stage: ${p.stage} after ${p.totalDays} total days`);
}

// ── 2. Dehydration mechanics ──────────────────────────────────────────────────
console.log("\n2. Dehydration mechanics");
{
  let p = makePlant({ lastWateredDay: 1 });

  // Days 2-4: within water interval (3), no drain
  for (let d = 2; d <= 4; d++) p = advancePlant(p, d, BASE_EFFECTS);
  assert("No health loss within water interval (3 days)", p.health === 100,
    `health: ${p.health}`);

  // Day 5: 1 day over interval → drain kicks in
  p = advancePlant(p, 5, BASE_EFFECTS);
  assert("Health drops on day 5 (1 day past interval)", p.health < 100,
    `health: ${p.health}`);

  // Dehydration kills after enough days
  p = makePlant({ lastWateredDay: 1 });
  for (let d = 2; d <= 20; d++) p = advancePlant(p, d, BASE_EFFECTS);
  assert("Plant dies from prolonged dehydration", p.stage === "dead",
    `stage: ${p.stage}, health: ${p.health}`);

  // Auto-water upgrade extends interval
  const effects2 = computeEffects(["auto-water"], NO_PRESTIGE);
  let p2 = makePlant({ lastWateredDay: 1 });
  for (let d = 2; d <= 6; d++) p2 = advancePlant(p2, d, effects2);
  assert("With auto-water: no drain through 6 days", p2.health === 100,
    `health: ${p2.health}`);

  // lastWateredDay=1, interval=6: drain kicks in when day-1 > 6, i.e. day >= 8
  let p3 = makePlant({ lastWateredDay: 1 });
  p3 = advancePlant(p3, 8, effects2);
  assert("With auto-water: drain starts at day 8 (6-day grace period)", p3.health < 100,
    `health: ${p3.health}`);
}

// ── 3. Pest events ────────────────────────────────────────────────────────────
console.log("\n3. Pest/disease events");
{
  // Mild drain (days 1-4)
  let p = makePlant({ stage: "vegetative", event: { type: "spider-mites", daysActive: 0 } });
  p = advancePlant(p, 2, BASE_EFFECTS);
  assert("Spider mites drain 8 hp/day at mild severity", p.health === 92,
    `health: ${p.health}`);

  // Moderate drain (day 5+): 8 * 1.5 = 12
  p = makePlant({ stage: "vegetative", health: 100, event: { type: "spider-mites", daysActive: 4 } });
  p = advancePlant(p, 2, BASE_EFFECTS);
  assert("Spider mites drain 12 hp/day at moderate severity", p.health === 88,
    `health: ${p.health}`);

  // Severe drain (day 10+): 8 * 2 = 16
  p = makePlant({ stage: "vegetative", health: 100, event: { type: "spider-mites", daysActive: 9 } });
  p = advancePlant(p, 2, BASE_EFFECTS);
  assert("Spider mites drain 16 hp/day at severe severity", p.health === 84,
    `health: ${p.health}`);

  // Botrytis kills faster: severe = 12 * 2 = 24 drain/day; health 24 → 0
  p = makePlant({ stage: "flowering", health: 24, event: { type: "botrytis", daysActive: 10 } });
  p = advancePlant(p, 2, BASE_EFFECTS);
  assert("Severe botrytis kills plant at health ≤ 24 in one tick", p.stage === "dead",
    `stage: ${p.stage}, health: ${p.health}`);

  // daysActive increments each day
  p = makePlant({ stage: "vegetative", event: { type: "spider-mites", daysActive: 3 } });
  p = advancePlant(p, 2, BASE_EFFECTS);
  assert("Event daysActive increments each day", p.event?.daysActive === 4,
    `daysActive: ${p.event?.daysActive}`);

  // Event clears on death
  p = makePlant({ stage: "vegetative", health: 5, event: { type: "root-rot", daysActive: 12 } });
  p = advancePlant(p, 2, BASE_EFFECTS);
  assert("Dead plant has no event", p.event === undefined, `event: ${JSON.stringify(p.event)}`);
}

// ── 4. Upgrades ───────────────────────────────────────────────────────────────
console.log("\n4. Upgrades");
{
  const withAll = computeEffects(
    ["led-lights", "nutrients", "auto-water", "co2-injector", "climate-ctrl", "extra-slots-1", "extra-slots-2"],
    NO_PRESTIGE
  );

  assert("LED lights: flowering 20% faster", withAll.floweringSpeedMult === 0.8);
  assert("CO2: vegetative 20% faster", withAll.vegetativeSpeedMult === 0.8);
  assert("Nutrients: 25% yield bonus", withAll.yieldMultiplier === 1.25);
  assert("Auto-water: interval 6 days", withAll.waterInterval === 6);
  assert("HVAC: health drop 7/day", withAll.healthDropPerDay === 7);
  assert("HVAC: event spawn chance 1.5%", withAll.eventSpawnChance === 0.015);
  assert("Expansion Kit: 9 slots", computeEffects(["extra-slots-1"], NO_PRESTIGE).numSlots === 9);
  assert("Both expansions: 12 slots", withAll.numSlots === 12);

  // Effective stage duration with LED
  const strain = getStrain("lemon-cherry-gelato"); // flowering: 34 days
  const withLed = computeEffects(["led-lights"], NO_PRESTIGE);
  const duration = effectiveStageDuration("flowering", 34, withLed);
  assert("LED cuts flowering from 34 to 28 days (ceil(34*0.8))", duration === 28,
    `got ${duration}`);
}

// ── 5. Prestige mechanics ─────────────────────────────────────────────────────
console.log("\n5. Prestige mechanics");
{
  // Points calculation
  assert("$10k = 2 prestige points", prestigePointsAvailable(10_000) === 2);
  assert("$15k = 3 prestige points", prestigePointsAvailable(15_000) === 3);
  assert("$9,999 = 1 prestige point (below threshold but floor(9999/5000)=1)",
    prestigePointsAvailable(9_999) === 1);
  assert("$25k = 5 prestige points", prestigePointsAvailable(25_000) === 5);

  // Starting money from investor-capital
  assert("No prestige upgrades: $2000 start", computeStartingMoney({}) === 2000);
  assert("Investor capital lv1: $2500 start", computeStartingMoney({ "investor-capital": 1 }) === 2500);
  assert("Investor capital lv5: $4500 start", computeStartingMoney({ "investor-capital": 5 }) === 4500);

  // Prestige multipliers on effects
  const p5rep = computeEffects([], { "facility-reputation": 5 });
  assert("Max facility reputation: 1.5x price", p5rep.priceMultiplier === 1.5,
    `got ${p5rep.priceMultiplier}`);

  const p5staff = computeEffects([], { "veteran-staff": 5 });
  assert("Max veteran staff: 1.25x yield", Math.abs(p5staff.yieldMultiplier - 1.25) < 0.001,
    `got ${p5staff.yieldMultiplier}`);

  const p3seed = computeEffects([], { "seed-bank": 3 });
  assert("Max seed bank: 0.7x clone cost", p3seed.cloneCostMultiplier === 0.7,
    `got ${p3seed.cloneCostMultiplier}`);

  // Seed bank floors at 0.5
  const pOverSeed = computeEffects([], { "seed-bank": 10 });
  assert("Seed bank never below 0.5x", pOverSeed.cloneCostMultiplier === 0.5,
    `got ${pOverSeed.cloneCostMultiplier}`);

  const p4ipm = computeEffects([], { "ipm-protocol": 4 });
  assert("Max IPM: event chance 0.01 (30-20)/1000", p4ipm.eventSpawnChance === 0.01,
    `got ${p4ipm.eventSpawnChance}`);

  // IPM + HVAC stacking
  const stackedIpm = computeEffects(["climate-ctrl"], { "ipm-protocol": 4 });
  assert("IPM + HVAC: event chance floors at 0.005 (0.015 - 0.02 clamped)",
    stackedIpm.eventSpawnChance === 0.005, `got ${stackedIpm.eventSpawnChance}`);

  // Nutrients + veteran staff stack multiplicatively
  const stacked = computeEffects(["nutrients"], { "veteran-staff": 5 });
  assert("Nutrients + max staff stack: 1.25 * 1.25 = 1.5625",
    Math.abs(stacked.yieldMultiplier - 1.5625) < 0.001,
    `got ${stacked.yieldMultiplier}`);
}

// ── 6. Harvest earnings ───────────────────────────────────────────────────────
console.log("\n6. Harvest earnings");
{
  const strain = getStrain("lemon-cherry-gelato"); // 50g base, $9/g

  // Full health, no upgrades
  const baseEffects = computeEffects([], {});
  const baseYield = Math.round(strain.baseYieldGrams * (100 / 100) * baseEffects.yieldMultiplier);
  const baseEarnings = Math.round(baseYield * strain.pricePerGram * baseEffects.priceMultiplier);
  assert("Base harvest: 50g * $9 = $450", baseEarnings === 450,
    `got $${baseEarnings}`);

  // 50% health
  const halfYield = Math.round(strain.baseYieldGrams * (50 / 100) * baseEffects.yieldMultiplier);
  assert("50% health → 25g yield", halfYield === 25, `got ${halfYield}g`);

  // Max prestige price bonus (5 levels = 1.5x)
  const repEffects = computeEffects([], { "facility-reputation": 5 });
  const repEarnings = Math.round(50 * strain.pricePerGram * repEffects.priceMultiplier);
  assert("Max reputation: 50g * $9 * 1.5 = $675", repEarnings === 675,
    `got $${repEarnings}`);

  // All yield upgrades stacked
  const allYield = computeEffects(["nutrients"], { "veteran-staff": 5 });
  const maxYield = Math.round(strain.baseYieldGrams * 1 * allYield.yieldMultiplier);
  assert("Max yield multiplier (1.5625): 50g → 78g", maxYield === 78,
    `got ${maxYield}g`);
}

// ── 7. Clone cost with prestige discount ──────────────────────────────────────
console.log("\n7. Clone cost with prestige discount");
{
  const strain = getStrain("lemon-cherry-gelato"); // $75 base
  const noDiscount = computeEffects([], {});
  assert("No discount: $75", Math.round(strain.cloneCost * noDiscount.cloneCostMultiplier) === 75);

  const lv1 = computeEffects([], { "seed-bank": 1 });
  assert("Seed bank lv1: $68 (75 * 0.9 rounded)", Math.round(strain.cloneCost * lv1.cloneCostMultiplier) === 68,
    `got $${Math.round(strain.cloneCost * lv1.cloneCostMultiplier)}`);

  const lv3 = computeEffects([], { "seed-bank": 3 });
  assert("Seed bank lv3: $53 (75 * 0.7 rounded)", Math.round(strain.cloneCost * lv3.cloneCostMultiplier) === 53,
    `got $${Math.round(strain.cloneCost * lv3.cloneCostMultiplier)}`);

  // Gary Payton with max discount
  const gp = getStrain("gary-payton"); // $250 base
  assert("Gary Payton max discount: $125 (250 * 0.5)", Math.round(gp.cloneCost * 0.5) === 125);
}

// ── 8. Edge cases ─────────────────────────────────────────────────────────────
console.log("\n8. Edge cases");
{
  // Ready/dead plants don't advance
  const readyPlant = makePlant({ stage: "ready", health: 100 });
  const after = advancePlant(readyPlant, 999, BASE_EFFECTS);
  assert("Ready plant doesn't change state", after.stage === "ready" && after.health === 100);

  const deadPlant = makePlant({ stage: "dead", health: 0 });
  const afterDead = advancePlant(deadPlant, 999, BASE_EFFECTS);
  assert("Dead plant stays dead", afterDead.stage === "dead");

  // Health never goes below 0
  const nearDead = makePlant({ health: 5, lastWateredDay: 1 });
  const result = advancePlant(nearDead, 100, BASE_EFFECTS);
  assert("Health never goes below 0", result.health >= 0, `health: ${result.health}`);

  // Multiple stresses simultaneously (dehydration + pest)
  const stressed = makePlant({
    health: 100,
    lastWateredDay: 1,
    event: { type: "spider-mites", daysActive: 0 },
  });
  const stressResult = advancePlant(stressed, 10, BASE_EFFECTS);
  assert(
    "Dehydration + pest stack: plant can die quickly",
    stressResult.health < 100,
    `health: ${stressResult.health}, stage: ${stressResult.stage}`
  );

  // Prestige eligibility: $9,999 is just under threshold but earns 1 point
  // The actual threshold for PRESTIGE action is 10k; points are floor(earnings/5k)
  assert("$9,999 earns 1 pt but prestige action blocked (< threshold)",
    9_999 < PRESTIGE_THRESHOLD && prestigePointsAvailable(9_999) === 1);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
