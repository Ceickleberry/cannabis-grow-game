"use client";

import { useGame } from "@/lib/gameState";
import { STRAINS } from "@/lib/strains";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-xs font-semibold text-zinc-200 tabular-nums">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-800 rounded-lg p-3 flex flex-col gap-0.5">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{title}</h3>
      {children}
    </div>
  );
}

export default function StatsPanel() {
  const { state } = useGame();
  const {
    day, money, plants,
    runHarvests, runGrams, runBestBatch, lifetimeEarnings,
    allTimeEarnings, allTimeHarvests, allTimeGrams, allTimeBestBatch,
    prestigeCount, strainStats,
  } = state;

  const stageCounts = plants.reduce<Record<string, number>>((acc, p) => {
    acc[p.stage] = (acc[p.stage] ?? 0) + 1;
    return acc;
  }, {});

  const activeEvents = plants.filter((p) => p.event).length;

  const strainRows = STRAINS.map((s) => ({
    strain: s,
    stat: strainStats[s.id] ?? { harvests: 0, grams: 0, earnings: 0 },
  })).filter((r) => r.stat.harvests > 0).sort((a, b) => b.stat.earnings - a.stat.earnings);

  const STAGE_LABELS: Record<string, string> = {
    germination: "Germinating",
    seedling: "Seedling",
    vegetative: "Veg",
    flowering: "Flowering",
    ready: "Ready",
    dead: "Dead",
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Facility snapshot */}
      <Section title="Facility">
        <StatRow label="Day" value={String(day)} />
        <StatRow label="Balance" value={`$${money.toLocaleString()}`} />
        <StatRow label="Plants active" value={String(plants.length)} />
        {Object.entries(stageCounts).map(([stage, count]) => (
          <StatRow key={stage} label={`  ${STAGE_LABELS[stage] ?? stage}`} value={String(count)} />
        ))}
        {activeEvents > 0 && (
          <StatRow label="⚠ Active pest events" value={String(activeEvents)} />
        )}
      </Section>

      {/* Current run */}
      <Section title={`Run #${prestigeCount + 1}`}>
        <StatRow label="Revenue this run" value={`$${lifetimeEarnings.toLocaleString()}`} />
        <StatRow label="Batches harvested" value={String(runHarvests)} />
        <StatRow label="Grams harvested" value={`${runGrams.toLocaleString()}g`} />
        <StatRow label="Best batch" value={runBestBatch > 0 ? `$${runBestBatch.toLocaleString()}` : "—"} />
      </Section>

      {/* All-time */}
      <Section title="All-Time">
        <StatRow label="Total runs completed" value={String(prestigeCount)} />
        <StatRow label="Career earnings" value={`$${allTimeEarnings.toLocaleString()}`} />
        <StatRow label="Total harvests" value={String(allTimeHarvests)} />
        <StatRow label="Total grams" value={`${allTimeGrams.toLocaleString()}g`} />
        <StatRow label="Record batch" value={allTimeBestBatch > 0 ? `$${allTimeBestBatch.toLocaleString()}` : "—"} />
      </Section>

      {/* Per-strain breakdown */}
      {strainRows.length > 0 && (
        <div className="bg-zinc-800 rounded-lg p-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">By Cultivar</h3>
          <div className="flex flex-col gap-2">
            {strainRows.map(({ strain, stat }) => (
              <div key={strain.id} className="border border-zinc-700 rounded-md p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span>{strain.emoji}</span>
                  <span className="text-xs font-semibold text-zinc-200">{strain.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-center">
                    <div className="text-xs font-bold text-green-400">{stat.harvests}</div>
                    <div className="text-xs text-zinc-600">batches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-blue-400">{stat.grams.toLocaleString()}g</div>
                    <div className="text-xs text-zinc-600">grams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-yellow-400">${stat.earnings.toLocaleString()}</div>
                    <div className="text-xs text-zinc-600">revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {strainRows.length === 0 && (
        <p className="text-xs text-zinc-600 italic text-center py-2">No harvests recorded yet.</p>
      )}
    </div>
  );
}
