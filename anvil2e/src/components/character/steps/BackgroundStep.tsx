import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getGameDataByType } from "@/lib/db/queries"
import type { Background } from "@/lib/db/types"
import { queryKeys } from "@/lib/query"

interface BackgroundStepProps {
  selected: Background | null
  onSelect: (background: Background) => void
}

export function BackgroundStep({ selected, onSelect }: BackgroundStepProps) {
  const [search, setSearch] = useState("")

  const { data: backgrounds = [], isLoading } = useQuery({
    queryKey: queryKeys.gamedata.byType("background"),
    queryFn: () => getGameDataByType<Background>("background"),
  })

  const filteredBackgrounds = backgrounds.filter((bg) =>
    bg.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Loading backgrounds...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Background</h2>
        <p className="text-slate-400 mt-1">
          Your background grants ability boosts and skill training
        </p>
      </div>

      <input
        type="text"
        placeholder="Search backgrounds..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
      />

      <div className="grid md:grid-cols-2 gap-4">
        {filteredBackgrounds.map((background) => {
          const isSelected = selected?._id === background._id
          const skills = background.system.trainedSkills?.value || []
          const lore = background.system.trainedLore

          return (
            <button
              key={background._id}
              onClick={() => onSelect(background)}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${
                  isSelected
                    ? "border-blue-600 bg-blue-600/10 ring-4 ring-blue-600/20"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800"
                }
              `}
            >
              <h3 className="text-lg font-bold mb-2">{background.name}</h3>

              {/* Ability boosts */}
              {background.system.boosts && (
                <div className="mb-2 text-sm">
                  <span className="text-green-400">▲ Ability Boosts: </span>
                  <span className="text-slate-400">
                    {Object.values(background.system.boosts)
                      .flatMap((b) => b.value)
                      .join(", ")}
                  </span>
                </div>
              )}

              {/* Skill training */}
              {skills.length > 0 && (
                <div className="text-sm mb-2">
                  <span className="text-blue-400">Skills: </span>
                  <span className="text-slate-400">{skills.join(", ")}</span>
                </div>
              )}

              {/* Lore */}
              {lore && (
                <div className="text-sm">
                  <span className="text-purple-400">Lore: </span>
                  <span className="text-slate-400">{lore}</span>
                </div>
              )}

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-blue-600/30 text-sm text-blue-400 font-semibold">
                  ✓ Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {filteredBackgrounds.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No backgrounds found matching "{search}"
        </div>
      )}
    </div>
  )
}
