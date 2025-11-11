/**
 * Root layout wrapper
 * Handles database initialization and data loading
 */

import { useEffect, useState } from "react"
import { Outlet, Link } from "react-router"
import { initDatabases, isDatabasesInitialized } from "@/lib/db"
import { isDataLoaded, loadCoreGameData } from "@/lib/data/loader"

export function RootLayout() {
  const [, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<{
    pack: string
    loaded: number
    total: number
  } | null>(null)

  useEffect(() => {
    async function initialize() {
      try {
        // Step 1: Initialize databases
        if (!isDatabasesInitialized()) {
          console.log("Initializing databases...")
          await initDatabases()
        }

        // Step 2: Load game data if needed
        if (!isDataLoaded()) {
          console.log("Loading game data...")
          await loadCoreGameData((progress) => {
            setLoadingProgress({
              pack: progress.pack,
              loaded: progress.loaded,
              total: progress.total,
            })
          })
        }

        setIsInitialized(true)
      } catch (err) {
        console.error("Initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize")
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold">Anvil2e</div>
          <div className="text-sm text-slate-400">
            {loadingProgress
              ? `Loading ${loadingProgress.pack}... ${loadingProgress.loaded}/${loadingProgress.total}`
              : "Initializing..."}
          </div>
          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: loadingProgress
                  ? `${(loadingProgress.loaded / loadingProgress.total) * 100}%`
                  : "10%",
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-red-500">Error</div>
          <div className="text-sm text-slate-400">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Main app layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-800 backdrop-blur-lg bg-slate-950/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            Anvil2e
          </Link>
          
          <div className="flex gap-4">
            <Link
              to="/characters"
              className="px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Characters
            </Link>
            <Link
              to="/characters/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              New Character
            </Link>
            <Link
              to="/settings"
              className="px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
