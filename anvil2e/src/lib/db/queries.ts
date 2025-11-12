/**
 * Query helpers for PouchDB
 * Type-safe wrappers around PouchDB Find API
 */

import { getGameDataDB, getCharactersDB, getPreferencesDB } from "./index"
import type { 
  GameDataDoc, 
  CharacterDoc, 
  PreferencesDoc,
  GameDataQuery,
  CharacterQuery
} from "./types"

// ============================================================================
// GAME DATA QUERIES
// ============================================================================

/**
 * Get all documents of a specific type
 */
export async function getGameDataByType<T extends GameDataDoc>(
  type: GameDataDoc["type"]
): Promise<T[]> {
  const db = getGameDataDB()
  
  try {
    const result = await db.find({
      selector: { type },
    })
    
    // Sort in JavaScript instead of database
    const docs = result.docs as T[]
    return docs.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error(`Failed to fetch ${type}:`, error)
    throw error
  }
}

/**
 * Get a single gamedata document by ID
 */
export async function getGameDataById<T extends GameDataDoc>(
  id: string
): Promise<T | null> {
  const db = getGameDataDB()
  
  try {
    const doc = await db.get(id)
    return doc as T
  } catch (error) {
    if ((error as PouchDB.Core.Error).status === 404) {
      return null
    }
    console.error(`Failed to fetch gamedata ${id}:`, error)
    throw error
  }
}

/**
 * Search gamedata by query
 */
export async function queryGameData<T extends GameDataDoc>(
  query: GameDataQuery
): Promise<T[]> {
  const db = getGameDataDB()
  
  try {
    const selector: PouchDB.Find.Selector = {}
    
    if (query.type) {
      selector.type = query.type
    }
    
    if (query.level !== undefined) {
      selector["system.level.value"] = query.level
    }
    
    if (query.traits && query.traits.length > 0) {
      selector["system.traits.value"] = { $in: query.traits }
    }
    
    // Text search (name only, for now)
    if (query.search) {
      selector.name = { $regex: new RegExp(query.search, "i") }
    }
    
    const result = await db.find({
      selector,
      limit: query.limit || 100,
      skip: query.skip || 0,
    })
    
    return result.docs as T[]
  } catch (error) {
    console.error("Failed to query gamedata:", error)
    throw error
  }
}

/**
 * Count documents by type
 */
export async function countGameDataByType(
  type: GameDataDoc["type"]
): Promise<number> {
  const db = getGameDataDB()
  
  try {
    const result = await db.find({
      selector: { type },
      fields: ["_id"],
    })
    
    return result.docs.length
  } catch (error) {
    console.error(`Failed to count ${type}:`, error)
    throw error
  }
}

// ============================================================================
// CHARACTER QUERIES
// ============================================================================

/**
 * Get all characters
 */
export async function getAllCharacters(): Promise<CharacterDoc[]> {
  const db = getCharactersDB()
  
  try {
    const result = await db.allDocs({
      include_docs: true,
    })
    
    return result.rows
      .filter(row => row.doc)
      .map(row => row.doc as CharacterDoc)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  } catch (error) {
    console.error("Failed to fetch characters:", error)
    throw error
  }
}

/**
 * Get a single character by ID
 */
export async function getCharacterById(
  id: string
): Promise<CharacterDoc | null> {
  const db = getCharactersDB()
  
  try {
    const doc = await db.get(id)
    return doc as CharacterDoc
  } catch (error) {
    if ((error as PouchDB.Core.Error).status === 404) {
      return null
    }
    console.error(`Failed to fetch character ${id}:`, error)
    throw error
  }
}

/**
 * Create a new character
 */
export async function createCharacter(
  character: Omit<CharacterDoc, "_id" | "_rev" | "createdAt" | "updatedAt" | "version">
): Promise<CharacterDoc> {
  const db = getCharactersDB()
  
  try {
    const now = new Date().toISOString()
    const newCharacter: CharacterDoc = {
      ...character,
      _id: `character_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    
    const result = await db.put(newCharacter)
    
    return {
      ...newCharacter,
      _rev: result.rev,
    }
  } catch (error) {
    console.error("Failed to create character:", error)
    throw error
  }
}

/**
 * Update an existing character
 */
export async function updateCharacter(
  character: CharacterDoc
): Promise<CharacterDoc> {
  const db = getCharactersDB()
  
  try {
    const updatedCharacter: CharacterDoc = {
      ...character,
      updatedAt: new Date().toISOString(),
    }
    
    const result = await db.put(updatedCharacter)
    
    return {
      ...updatedCharacter,
      _rev: result.rev,
    }
  } catch (error) {
    console.error("Failed to update character:", error)
    throw error
  }
}

/**
 * Delete a character
 */
export async function deleteCharacter(id: string): Promise<void> {
  const db = getCharactersDB()
  
  try {
    const doc = await db.get(id)
    await db.remove(doc)
  } catch (error) {
    console.error(`Failed to delete character ${id}:`, error)
    throw error
  }
}

/**
 * Query characters
 */
export async function queryCharacters(
  query: CharacterQuery
): Promise<CharacterDoc[]> {
  const db = getCharactersDB()
  
  try {
    const selector: PouchDB.Find.Selector = {}
    
    if (query.level !== undefined) {
      selector.level = query.level
    }
    
    if (query.minLevel !== undefined || query.maxLevel !== undefined) {
      selector.level = {}
      if (query.minLevel !== undefined) {
        selector.level.$gte = query.minLevel
      }
      if (query.maxLevel !== undefined) {
        selector.level.$lte = query.maxLevel
      }
    }
    
    if (query.classId) {
      selector.classId = query.classId
    }
    
    const result = await db.find({
      selector,
      limit: query.limit || 100,
      skip: query.skip || 0,
    })
    
    return result.docs as CharacterDoc[]
  } catch (error) {
    console.error("Failed to query characters:", error)
    throw error
  }
}

// ============================================================================
// PREFERENCES QUERIES
// ============================================================================

/**
 * Get user preferences (creates default if not exists)
 */
export async function getPreferences(): Promise<PreferencesDoc> {
  const db = getPreferencesDB()
  
  try {
    const doc = await db.get("user_preferences")
    return doc as PreferencesDoc
  } catch (error) {
    if ((error as PouchDB.Core.Error).status === 404) {
      // Create default preferences
      const defaultPrefs: PreferencesDoc = {
        _id: "user_preferences",
        theme: "dark",
        colorScheme: "default",
        fontSize: "md",
        animations: true,
        sounds: false,
        autoSave: true,
        cloudSync: false,
        aiSettings: {
          enabled: false,
          mode: "local",
        },
        onboardingComplete: false,
        version: 1,
      }
      
      await db.put(defaultPrefs)
      return defaultPrefs
    }
    
    console.error("Failed to fetch preferences:", error)
    throw error
  }
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  updates: Partial<Omit<PreferencesDoc, "_id" | "_rev">>
): Promise<PreferencesDoc> {
  const db = getPreferencesDB()
  
  try {
    const current = await getPreferences()
    const updated: PreferencesDoc = {
      ...current,
      ...updates,
    }
    
    const result = await db.put(updated)
    
    return {
      ...updated,
      _rev: result.rev,
    }
  } catch (error) {
    console.error("Failed to update preferences:", error)
    throw error
  }
}
