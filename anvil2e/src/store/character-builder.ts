/**
 * Character builder state management
 * Zustand store for managing character creation wizard
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Ancestry, Background, Class } from "@/lib/db/types"

// ============================================================================
// TYPES
// ============================================================================

export type AbilityScore = "str" | "dex" | "con" | "int" | "wis" | "cha"

export interface AbilityBoost {
  source: string // "ancestry", "background", "class", "free"
  choices: AbilityScore[] // Available choices
  selected?: AbilityScore // User's selection
}

export interface CharacterBuilderState {
  // Current step
  currentStep: number
  
  // Basic info
  name: string
  level: number
  
  // Selections
  ancestry: Ancestry | null
  background: Background | null
  class: Class | null
  
  // Ability scores
  abilityBoosts: AbilityBoost[]
  baseAbilities: Record<AbilityScore, number>
  
  // Draft management
  draftId?: string
  lastSaved?: string
  
  // Actions
  setCurrentStep: (step: number) => void
  setName: (name: string) => void
  setAncestry: (ancestry: Ancestry | null) => void
  setBackground: (background: Background | null) => void
  setClass: (classData: Class | null) => void
  setAbilityBoost: (index: number, ability: AbilityScore) => void
  saveDraft: () => void
  loadDraft: (draftId: string) => void
  reset: () => void
  
  // Computed
  canProceed: () => boolean
  getFinalAbilities: () => Record<AbilityScore, number>
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  currentStep: 0,
  name: "",
  level: 1,
  ancestry: null,
  background: null,
  class: null,
  abilityBoosts: [],
  baseAbilities: {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  },
}

// ============================================================================
// STORE
// ============================================================================

export const useCharacterBuilder = create<CharacterBuilderState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),
      
      setName: (name) => set({ name }),
      
      setAncestry: (ancestry) => {
        set({ ancestry })
        // TODO: When ancestry changes, rebuild ability boosts from system.boosts
      },
      
      setBackground: (background) => {
        set({ background })
        // TODO: When background changes, rebuild ability boosts from system.boosts
      },
      
      setClass: (classData) => {
        set({ class: classData })
        // TODO: When class changes, rebuild ability boosts from system.keyAbility
      },
      
      setAbilityBoost: (index, ability) => {
        const boosts = [...get().abilityBoosts]
        if (boosts[index]) {
          boosts[index].selected = ability
          set({ abilityBoosts: boosts })
        }
      },
      
      saveDraft: () => {
        set({ lastSaved: new Date().toISOString() })
        // TODO: Save to PouchDB
      },
      
      loadDraft: (draftId) => {
        set({ draftId })
        // TODO: Load from PouchDB
      },
      
      reset: () => set(initialState),
      
      canProceed: () => {
        const state = get()
        const step = state.currentStep
        
        // Step 0: Ancestry must be selected
        if (step === 0) return state.ancestry !== null
        
        // Step 1: Background must be selected
        if (step === 1) return state.background !== null
        
        // Step 2: Class must be selected
        if (step === 2) return state.class !== null
        
        // Step 3: All ability boosts must be assigned
        if (step === 3) {
          return state.abilityBoosts.every(boost => boost.selected !== undefined)
        }
        
        return true
      },
      
      getFinalAbilities: () => {
        const state = get()
        const abilities = { ...state.baseAbilities }
        
        // Apply all selected boosts
        state.abilityBoosts.forEach(boost => {
          if (boost.selected) {
            abilities[boost.selected] += 2
          }
        })
        
        return abilities
      },
    }),
    {
      name: "character-builder-storage",
      partialize: (state) => ({
        // Only persist these fields
        name: state.name,
        level: state.level,
        ancestry: state.ancestry,
        background: state.background,
        class: state.class,
        abilityBoosts: state.abilityBoosts,
        draftId: state.draftId,
        lastSaved: state.lastSaved,
      }),
    }
  )
)
