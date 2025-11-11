/**
 * PouchDB setup and database management
 * Three local databases: gamedata, characters, preferences
 * Optional sync with Supabase (CouchDB protocol)
 */

import PouchDB from "pouchdb-browser"
import PouchDBFind from "pouchdb-find"

// Install plugins
PouchDB.plugin(PouchDBFind)

// ============================================================================
// DATABASE INSTANCES
// ============================================================================

let gamedataDB: PouchDB.Database | null = null
let charactersDB: PouchDB.Database | null = null
let preferencesDB: PouchDB.Database | null = null

/**
 * Initialize all databases
 */
export async function initDatabases() {
  try {
    // Game data (PF2e rules, read-mostly)
    gamedataDB = new PouchDB("anvil2e_gamedata")
    
    // User characters (read-write, sync to cloud)
    charactersDB = new PouchDB("anvil2e_characters")
    
    // User preferences (read-write, local-only)
    preferencesDB = new PouchDB("anvil2e_preferences")

    // Create indexes for faster queries
    await createIndexes()

    console.log("✅ PouchDB databases initialized")
    return { gamedataDB, charactersDB, preferencesDB }
  } catch (error) {
    console.error("❌ Failed to initialize databases:", error)
    throw error
  }
}

/**
 * Create indexes for common queries
 */
async function createIndexes() {
  if (!gamedataDB || !charactersDB) return

  try {
    // Gamedata indexes
    await gamedataDB.createIndex({
      index: { fields: ["type"] }
    })
    await gamedataDB.createIndex({
      index: { fields: ["type", "system.level.value"] }
    })
    await gamedataDB.createIndex({
      index: { fields: ["name"] }
    })

    // Character indexes
    await charactersDB.createIndex({
      index: { fields: ["level"] }
    })
    await charactersDB.createIndex({
      index: { fields: ["classId"] }
    })
    await charactersDB.createIndex({
      index: { fields: ["updatedAt"] }
    })

    console.log("✅ Database indexes created")
  } catch (error) {
    console.error("❌ Failed to create indexes:", error)
    throw error
  }
}

/**
 * Get gamedata database
 */
export function getGameDataDB(): PouchDB.Database {
  if (!gamedataDB) {
    throw new Error("Gamedata database not initialized. Call initDatabases() first.")
  }
  return gamedataDB
}

/**
 * Get characters database
 */
export function getCharactersDB(): PouchDB.Database {
  if (!charactersDB) {
    throw new Error("Characters database not initialized. Call initDatabases() first.")
  }
  return charactersDB
}

/**
 * Get preferences database
 */
export function getPreferencesDB(): PouchDB.Database {
  if (!preferencesDB) {
    throw new Error("Preferences database not initialized. Call initDatabases() first.")
  }
  return preferencesDB
}

/**
 * Check if databases are initialized
 */
export function isDatabasesInitialized(): boolean {
  return gamedataDB !== null && charactersDB !== null && preferencesDB !== null
}

/**
 * Close all databases (for cleanup)
 */
export async function closeDatabases() {
  try {
    if (gamedataDB) await gamedataDB.close()
    if (charactersDB) await charactersDB.close()
    if (preferencesDB) await preferencesDB.close()
    
    gamedataDB = null
    charactersDB = null
    preferencesDB = null
    
    console.log("✅ Databases closed")
  } catch (error) {
    console.error("❌ Failed to close databases:", error)
    throw error
  }
}

/**
 * Destroy all databases (for testing/reset)
 */
export async function destroyDatabases() {
  try {
    await closeDatabases()
    
    await new PouchDB("anvil2e_gamedata").destroy()
    await new PouchDB("anvil2e_characters").destroy()
    await new PouchDB("anvil2e_preferences").destroy()
    
    console.log("✅ Databases destroyed")
  } catch (error) {
    console.error("❌ Failed to destroy databases:", error)
    throw error
  }
}

// ============================================================================
// SYNC MANAGEMENT (for Supabase)
// ============================================================================

let charactersSyncHandler: PouchDB.Replication.Sync<Record<string, never>> | null = null

/**
 * Start syncing characters to Supabase (CouchDB protocol)
 */
export function startCharactersSync(remoteUrl: string) {
  if (!charactersDB) {
    throw new Error("Characters database not initialized")
  }

  if (charactersSyncHandler) {
    console.warn("⚠️ Sync already running, stopping old handler")
    charactersSyncHandler.cancel()
  }

  try {
    const remoteDB = new PouchDB(remoteUrl)
    
    charactersSyncHandler = charactersDB.sync(remoteDB, {
      live: true,
      retry: true,
    })
      .on("change", (info) => {
        console.log("🔄 Sync change:", info)
      })
      .on("paused", () => {
        console.log("⏸️ Sync paused (caught up)")
      })
      .on("active", () => {
        console.log("▶️ Sync resumed")
      })
      .on("error", (err) => {
        console.error("❌ Sync error:", err)
      })

    console.log("✅ Characters sync started")
    return charactersSyncHandler
  } catch (error) {
    console.error("❌ Failed to start sync:", error)
    throw error
  }
}

/**
 * Stop syncing characters
 */
export function stopCharactersSync() {
  if (charactersSyncHandler) {
    charactersSyncHandler.cancel()
    charactersSyncHandler = null
    console.log("✅ Characters sync stopped")
  }
}

/**
 * Check sync status
 */
export function isSyncActive(): boolean {
  return charactersSyncHandler !== null
}
