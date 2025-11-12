/**
 * Ancestry selection step
 * Browse and select character ancestry with search/filter
 */

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getGameDataByType } from "@/lib/db/queries"
import type { Ancestry } from "@/lib/db/types"
import { queryKeys } from "@/lib/query"

interface AncestryStepProps {
  selected: Ancestry | null
  onSelect: (ancestry: Ancestry) => void
}

export function AncestryStep({ selected, onSelect }: AncestryStepProps) {
  const [search, setSearch] = useState("")

  // Fetch all ancestries
  const { data: ancestries = [], isLoading } = useQuery({
    queryKey: queryKeys.gamedata.byType("ancestry"),
    queryFn: () => getGameDataByType<Ancestry>("ancestry"),
  })

  // Filter ancestries by search
  const filteredAncestries = ancestries.filter((ancestry) =>
    ancestry.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Loading ancestries...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Choose Your Ancestry</h2>
        <p className="text-slate-400 mt-1">
          Your ancestry determines your size, speed, hit points, and heritage
        </p>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search ancestries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Ancestry grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAncestries.map((ancestry) => {
          const isSelected = selected?._id === ancestry._id
          const hp = ancestry.system.hp || 0
          const size = ancestry.system.size || "med"
          const speed = ancestry.system.speed || 25

          return (
            <button
              key={ancestry._id}
              onClick={() => onSelect(ancestry)}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${
                  isSelected
                    ? "border-blue-600 bg-blue-600/10 ring-4 ring-blue-600/20"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800"
                }
              `}
            >
              {/* Name and rarity */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold">{ancestry.name}</h3>
                {ancestry.system.traits?.rarity && ancestry.system.traits.rarity !== "common" && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-600/20 text-purple-400">
                    {ancestry.system.traits.rarity}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">HP</span>
                  <span className="font-semibold text-green-400">{hp}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Size</span>
                  <span className="font-semibold text-blue-400">{size.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Speed</span>
                  <span className="font-semibold text-yellow-400">{speed}ft</span>
                </div>
              </div>

              {/* Ability boosts/flaws */}
              <div className="space-y-1 text-xs">
                {ancestry.system.boosts && Object.keys(ancestry.system.boosts).length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">▲</span>
                    <span className="text-slate-400">
                      {Object.values(ancestry.system.boosts)
                        .flatMap((b) => b.value)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {ancestry.system.flaws && Object.keys(ancestry.system.flaws).length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">▼</span>
                    <span className="text-slate-400">
                      {Object.values(ancestry.system.flaws)
                        .flatMap((f) => f.value)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-blue-600/30 text-sm text-blue-400 font-semibold">
                  ✓ Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {filteredAncestries.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No ancestries found matching "{search}"
        </div>
      )}
    </div>
  )
}
