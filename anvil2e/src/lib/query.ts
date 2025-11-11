/**
 * TanStack Query setup for Anvil2e
 * Provides reactive queries over PouchDB data
 */

import { QueryClient } from "@tanstack/react-query"

/**
 * Global query client configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Longer staleTime since PouchDB is local and fast
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Refetch less aggressively (data is local)
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      
      // Retry only once for local queries
      retry: 1,
      
      // Keep unused data cached longer
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
})

/**
 * Query keys factory for type-safe query keys
 */
export const queryKeys = {
  // Gamedata queries
  gamedata: {
    all: ["gamedata"] as const,
    byType: (type: string) => ["gamedata", "type", type] as const,
    byId: (id: string) => ["gamedata", "id", id] as const,
    search: (query: string) => ["gamedata", "search", query] as const,
  },
  
  // Character queries
  characters: {
    all: ["characters"] as const,
    byId: (id: string) => ["characters", "id", id] as const,
    byClass: (classId: string) => ["characters", "class", classId] as const,
  },
  
  // Preferences
  preferences: ["preferences"] as const,
  
  // Data loading status
  dataStatus: ["dataStatus"] as const,
} as const
