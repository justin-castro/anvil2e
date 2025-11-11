/**
 * Database types and schemas for Anvil2e
 * Three databases: gamedata (PF2e rules), characters (user data), preferences (settings)
 */

// ============================================================================
// GAME DATA TYPES (from PF2e compendiums)
// ============================================================================

export interface GameDataDoc {
  _id: string
  _rev?: string
  type: "ancestry" | "background" | "class" | "feat" | "spell" | "equipment" | "action" | "bestiary" | "condition" | "deity"
  system: Record<string, unknown> // PF2e system data
  name: string
  img?: string
  folder?: string
  sort?: number
  flags?: Record<string, unknown>
}

export interface Ancestry extends GameDataDoc {
  type: "ancestry"
  system: {
    hp: number
    size: "tiny" | "sm" | "med" | "lg" | "huge" | "grg"
    speed: number
    boosts: Record<string, { value: string[] }>
    flaws: Record<string, { value: string[] }>
    languages: {
      value: string[]
      custom: string
    }
    traits: {
      value: string[]
      rarity: string
    }
    vision: string
    description: {
      value: string
    }
  }
}

export interface Background extends GameDataDoc {
  type: "background"
  system: {
    boosts: Record<string, { value: string[] }>
    trainedSkills: {
      value: string[]
    }
    trainedLore: string
    description: {
      value: string
    }
  }
}

export interface Class extends GameDataDoc {
  type: "class"
  system: {
    hp: number
    keyAbility: {
      value: string[]
    }
    perception: number
    savingThrows: {
      fortitude: number
      reflex: number
      will: number
    }
    trainedSkills: {
      value: string[]
      additional: number
    }
    attacks: {
      simple: number
      martial: number
      advanced: number
      unarmed: number
      other: { name: string; rank: number }
    }
    defenses: {
      unarmored: number
      light: number
      medium: number
      heavy: number
    }
    classDC: number
    description: {
      value: string
    }
  }
}

export interface Feat extends GameDataDoc {
  type: "feat"
  system: {
    level: {
      value: number
    }
    traits: {
      value: string[]
      rarity: string
    }
    featType: {
      value: string
    }
    actionType: {
      value: string
    }
    actions: {
      value: string | null
    }
    prerequisites: {
      value: Array<{ value: string }>
    }
    description: {
      value: string
    }
  }
}

// ============================================================================
// CHARACTER TYPES (user data)
// ============================================================================

export interface CharacterDoc {
  _id: string
  _rev?: string
  name: string
  level: number
  experience: number
  ancestryId: string
  backgroundId: string
  classId: string
  abilities: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
  hp: {
    current: number
    max: number
    temp: number
  }
  skills: Record<string, {
    rank: number // 0=untrained, 1=trained, 2=expert, 3=master, 4=legendary
    modifier: number
  }>
  feats: Array<{
    id: string
    level: number
    featType: string
  }>
  spells?: {
    slots: Record<number, { max: number; current: number }>
    known: Array<{ id: string; level: number }>
  }
  equipment: Array<{
    id: string
    quantity: number
    equipped: boolean
    invested?: boolean
  }>
  wealth: {
    cp: number
    sp: number
    gp: number
    pp: number
  }
  notes: string
  createdAt: string
  updatedAt: string
  version: number // For schema migrations
}

// ============================================================================
// PREFERENCES TYPES (app settings)
// ============================================================================

export interface PreferencesDoc {
  _id: "user_preferences"
  _rev?: string
  theme: "dark" | "light" | "auto"
  colorScheme: "default" | "blue" | "purple" | "green"
  fontSize: "sm" | "md" | "lg"
  animations: boolean
  sounds: boolean
  autoSave: boolean
  cloudSync: boolean
  supabaseUrl?: string
  supabaseKey?: string
  lastSyncAt?: string
  aiSettings: {
    enabled: boolean
    mode: "local" | "api"
    apiProvider?: "openai" | "anthropic" | "groq" | "gemini"
    apiKey?: string
    model?: string
  }
  onboardingComplete: boolean
  version: number
}

// ============================================================================
// DATABASE QUERY TYPES
// ============================================================================

export interface QueryOptions {
  limit?: number
  skip?: number
  sort?: Array<string | { [key: string]: "asc" | "desc" }>
  selector?: PouchDB.Find.Selector
}

export interface GameDataQuery extends QueryOptions {
  type?: GameDataDoc["type"]
  level?: number
  traits?: string[]
  search?: string
}

export interface CharacterQuery extends QueryOptions {
  level?: number
  classId?: string
  minLevel?: number
  maxLevel?: number
}
