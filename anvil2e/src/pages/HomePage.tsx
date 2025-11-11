/**
 * Home page - landing/dashboard
 */

import { Link } from "react-router"

export function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold">Anvil2e</h1>
        <p className="text-xl text-slate-400">
          Pathfinder 2e Character Builder
        </p>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto">
          Offline-first character builder and sheet for Pathfinder 2nd Edition.
          Fast, reliable, and works without internet.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Link
          to="/characters/new"
          className="p-8 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors space-y-2"
        >
          <div className="text-2xl font-bold">Create Character</div>
          <div className="text-sm text-slate-400">
            Start building a new Pathfinder 2e character
          </div>
        </Link>

        <Link
          to="/characters"
          className="p-8 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors space-y-2"
        >
          <div className="text-2xl font-bold">My Characters</div>
          <div className="text-sm text-slate-400">
            View and manage your saved characters
          </div>
        </Link>
      </div>
    </div>
  )
}
