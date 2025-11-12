import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getGameDataByType } from "@/lib/db/queries"
import type { Class } from "@/lib/db/types"
import { queryKeys } from "@/lib/query"

interface ClassStepProps {
  selected: Class | null
  onSelect: (classData: Class) => void
}

export function ClassStep({ selected, onSelect }: ClassStepProps) {
  const [search, setSearch] = useState("")

  const { data: classes = [], isLoading } = useQuery({
    queryKey: queryKeys.gamedata.byType("class"),
    queryFn: () => getGameDataByType<Class>("class"),
  })

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Loading classes...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Class</h2>
        <p className="text-slate-400 mt-1">
          Your class determines your abilities, proficiencies, and playstyle
        </p>
      </div>

      <input
        type="text"
        placeholder="Search classes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((classData) => {
          const isSelected = selected?._id === classData._id
          const hp = classData.system.hp || 0
          const keyAbilities = classData.system.keyAbility?.value || []

          return (
            <button
              key={classData._id}
              onClick={() => onSelect(classData)}
              className={`
                p-4 rounded-xl border-2 text-left transition-all
                ${
                  isSelected
                    ? "border-blue-600 bg-blue-600/10 ring-4 ring-blue-600/20"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800"
                }
              `}
            >
              <h3 className="text-lg font-bold mb-2">{classData.name}</h3>

              {/* HP */}
              <div className="flex items-center gap-4 mb-3 text-sm">
                <div>
                  <span className="text-slate-500">HP </span>
                  <span className="font-semibold text-green-400">{hp}</span>
                </div>
                <div>
                  <span className="text-slate-500">Key </span>
                  <span className="font-semibold text-yellow-400">
                    {keyAbilities.join(" or ")}
                  </span>
                </div>
              </div>

              {/* Proficiencies */}
              <div className="space-y-1 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500">Perception:</span> {classData.system.perception}
                </div>
                <div>
                  <span className="text-slate-500">Saves:</span> Fort {classData.system.savingThrows?.fortitude}, Ref {classData.system.savingThrows?.reflex}, Will {classData.system.savingThrows?.will}
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-blue-600/30 text-sm text-blue-400 font-semibold">
                  ✓ Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No classes found matching "{search}"
        </div>
      )}
    </div>
  )
}
