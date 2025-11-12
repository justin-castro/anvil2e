/**
 * Data loader for importing PF2e compendiums from public/data/packs/ into PouchDB
 * Runs on first launch, tracks progress in localStorage
 */

import { getGameDataDB } from "@/lib/db"
import type { GameDataDoc } from "@/lib/db/types"

// ============================================================================
// PACK CONFIGURATION
// ============================================================================

/**
 * Core packs to load (essential for character building)
 */
const CORE_PACKS = [
  "ancestries",
  "backgrounds", 
  "classes",
  "classfeatures",
  "feats",
  "spells",
  "equipment",
  "actions",
] as const

/**
 * Optional packs (load later or on-demand)
 */
export const OPTIONAL_PACKS = [
  "bestiary",
  "bestiary-ability-glossary-srd",
  "conditions",
  "deities",
  "domains",
] as const

type PackName = typeof CORE_PACKS[number] | typeof OPTIONAL_PACKS[number]

// ============================================================================
// LOADING STATE
// ============================================================================

interface LoadingProgress {
  pack: string
  loaded: number
  total: number
  status: "loading" | "complete" | "error"
  error?: string
}

type LoadingCallback = (progress: LoadingProgress) => void

// ============================================================================
// LOADER FUNCTIONS
// ============================================================================

/**
 * Check if gamedata has been loaded
 */
export function isDataLoaded(): boolean {
  return localStorage.getItem("anvil2e_data_loaded") === "true"
}

/**
 * Mark data as loaded
 */
function markDataLoaded() {
  localStorage.setItem("anvil2e_data_loaded", "true")
  localStorage.setItem("anvil2e_data_loaded_at", new Date().toISOString())
}

/**
 * Clear data loaded flag (for re-importing)
 */
export function clearDataLoadedFlag() {
  localStorage.removeItem("anvil2e_data_loaded")
  localStorage.removeItem("anvil2e_data_loaded_at")
}

/**
 * Load a single pack from directory of JSON files
 */
async function loadPack(
  packName: PackName,
  onProgress?: LoadingCallback
): Promise<number> {
  const db = getGameDataDB()
  
  try {
    // Fetch manifest to get list of files
    const manifestResponse = await fetch("/data/manifest.json")
    if (!manifestResponse.ok) {
      throw new Error("Failed to fetch manifest - run: node scripts/generate-manifest.js")
    }
    
    const manifest = await manifestResponse.json() as Record<string, string[]>
    const files = manifest[packName]
    
    if (!files || files.length === 0) {
      console.warn(`⚠️ Pack ${packName} has no files in manifest`)
      return 0
    }
    
    onProgress?.({
      pack: packName,
      loaded: 0,
      total: files.length,
      status: "loading",
    })
    
    // Fetch all files in parallel (in batches to avoid overwhelming browser)
    const batchSize = 50
    const gameDataDocs: GameDataDoc[] = []
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      
      const batchDocs = await Promise.all(
        batch.map(async (filename) => {
          try {
            const response = await fetch(`/data/packs/${packName}/${filename}`)
            if (!response.ok) return null
            
            const doc = await response.json() as Record<string, unknown>
            const type = getTypeFromPackName(packName)
            
            return {
              _id: doc._id as string || `${packName}_${filename.replace('.json', '')}`,
              type,
              name: (doc.name as string) || "Unnamed",
              system: (doc.system as Record<string, unknown>) || {},
              img: doc.img as string | undefined,
              folder: doc.folder as string | undefined,
              sort: doc.sort as number | undefined,
              flags: doc.flags as Record<string, unknown> | undefined,
            } as GameDataDoc
          } catch (err) {
            console.warn(`Failed to load ${filename}:`, err)
            return null
          }
        })
      )
      
      // Filter out nulls and add to collection
      gameDataDocs.push(...batchDocs.filter((doc): doc is GameDataDoc => doc !== null))
      
      // Update progress
      onProgress?.({
        pack: packName,
        loaded: Math.min(i + batchSize, files.length),
        total: files.length,
        status: "loading",
      })
    }
    
    // Bulk insert (faster than individual puts)
    const result = await db.bulkDocs(gameDataDocs, { new_edits: false })
    
    const successCount = result.filter((r: PouchDB.Core.Response | PouchDB.Core.Error): r is PouchDB.Core.Response => "ok" in r && r.ok === true).length
    const errorCount = result.length - successCount
    
    if (errorCount > 0) {
      console.warn(`⚠️ ${errorCount} errors importing ${packName}`)
    }
    
    onProgress?.({
      pack: packName,
      loaded: successCount,
      total: files.length,
      status: "complete",
    })
    
    return successCount
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`❌ Failed to load pack ${packName}:`, error)
    
    onProgress?.({
      pack: packName,
      loaded: 0,
      total: 0,
      status: "error",
      error: errorMsg,
    })
    
    throw error
  }
}

/**
 * Map pack name to document type
 */
function getTypeFromPackName(packName: PackName): GameDataDoc["type"] {
  const typeMap: Record<string, GameDataDoc["type"]> = {
    ancestries: "ancestry",
    backgrounds: "background",
    classes: "class",
    feats: "feat",
    spells: "spell",
    equipment: "equipment",
    actions: "action",
    bestiary: "bestiary",
    conditions: "condition",
    deities: "deity",
  }
  
  return typeMap[packName] || "feat" // Default fallback
}

/**
 * Load all core packs
 */
export async function loadCoreGameData(
  onProgress?: LoadingCallback
): Promise<void> {
  console.log("📦 Loading core game data...")
  
  let totalLoaded = 0
  
  for (const packName of CORE_PACKS) {
    try {
      const count = await loadPack(packName, onProgress)
      totalLoaded += count
      console.log(`✅ Loaded ${count} docs from ${packName}`)
    } catch (error) {
      console.error(`❌ Failed to load ${packName}, continuing...`, error)
      // Continue loading other packs even if one fails
    }
  }
  
  markDataLoaded()
  console.log(`✅ Core game data loaded: ${totalLoaded} total documents`)
}

/**
 * Load optional packs (on-demand)
 */
export async function loadOptionalGameData(
  packs: readonly PackName[],
  onProgress?: LoadingCallback
): Promise<void> {
  console.log("📦 Loading optional game data...")
  
  let totalLoaded = 0
  
  for (const packName of packs) {
    try {
      const count = await loadPack(packName, onProgress)
      totalLoaded += count
      console.log(`✅ Loaded ${count} docs from ${packName}`)
    } catch (error) {
      console.error(`❌ Failed to load ${packName}`, error)
    }
  }
  
  console.log(`✅ Optional game data loaded: ${totalLoaded} total documents`)
}

/**
 * Get loading status from localStorage
 */
export function getLoadingStatus(): {
  isLoaded: boolean
  loadedAt: string | null
} {
  return {
    isLoaded: isDataLoaded(),
    loadedAt: localStorage.getItem("anvil2e_data_loaded_at"),
  }
}

/**
 * Estimate total size of game data to load
 */
export function estimateDataSize(): { packs: number; estimatedMB: number } {
  return {
    packs: CORE_PACKS.length,
    estimatedMB: 50, // Approximate based on public/data size
  }
}
