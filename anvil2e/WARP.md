# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite application built as a web-based interface for Pathfinder 2nd Edition (PF2E) data. The project uses data from the Foundry VTT PF2E system and provides a modern web interface to interact with it.

**Tech Stack:**
- **Frontend:** React 19.1, TypeScript 5.9
- **Build Tool:** Vite 7.1
- **UI Components:** shadcn/ui (New York style), Radix UI primitives
- **Styling:** Tailwind CSS 4.1
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form with Zod validation
- **Routing:** React Router 7.9
- **Database:** Dexie (IndexedDB wrapper), Supabase
- **Backend Data:** Pathfinder 2E system data (JSON files in `public/data/`)

## Common Commands

### Development
```bash
npm run dev          # Start dev server with HMR (usually http://localhost:5173)
npm run build        # Type-check with tsc and build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on all TypeScript files
```

### Build Process
The build runs TypeScript compiler (`tsc -b`) followed by Vite build. The output goes to the `dist/` directory.

## Architecture

### Frontend Structure
- **`src/`** - Main application source code
  - **`App.tsx`** - Root application component
  - **`main.tsx`** - Application entry point
  - **`components/`** - Reusable React components
    - **`ui/`** - shadcn/ui components (Button, etc.)
  - **`lib/`** - Utility functions and helpers
    - **`utils.ts`** - Common utilities (e.g., `cn` for className merging)

### Data Layer
- **`public/data/`** - Pathfinder 2E game system data
  - **`src/`** - PF2E system TypeScript source (game mechanics)
    - **`module/`** - Core game modules (DC calculations, data models, etc.)
    - **`scripts/`** - Helper scripts for game operations
  - **`packs/`** - Game data compendiums (spells, equipment, bestiary, etc.)
  - **`tests/`** - Test files for game mechanics
  - **`build/`** - Build scripts for processing game data
  - **`static/`** - Static assets (templates, lang files, etc.)

The PF2E data uses a module-based architecture with path aliases (e.g., `@module/`, `@actor/`, `@item/`) defined in the source.

### Path Aliases
The project uses TypeScript path aliases defined in `tsconfig.json`:
- `@/*` maps to `./src/*`

This is also configured for shadcn/ui components in `components.json`.

### Supabase Integration
The app connects to Supabase for data storage. Environment variables are required:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key

These should be defined in a `.env` file (not committed to git).

### UI Component System
This project uses shadcn/ui with the "New York" style variant. Components are:
- Built on Radix UI primitives
- Styled with Tailwind CSS using CSS variables
- Use `class-variance-authority` for variant management
- Located in `src/components/ui/`
- Use Lucide React for icons

To add new shadcn components:
```bash
npx shadcn@latest add <component-name>
```

### State Management
- **Zustand** for global app state
- **TanStack Query** for server state and data fetching
- **React Hook Form** for form state

### Styling Approach
- Tailwind CSS with v4 (using `@tailwindcss/vite`)
- CSS variables for theming (defined in `src/index.css`)
- Utility-first approach with the `cn()` helper for conditional classes
- Form styling with `@tailwindcss/forms`
- Typography support with `@tailwindcss/typography`

## Code Standards

### React
- Uses React 19 with the React Compiler enabled (for automatic memoization)
- Functional components with hooks
- TypeScript strict mode enabled
- No unused locals or parameters allowed

### TypeScript
- **Target:** ES2022
- **Module:** ESNext with bundler resolution
- Strict type checking enabled
- Path aliases via `@/*` convention

### ESLint Configuration
The project uses ESLint with:
- TypeScript ESLint recommended config
- React Hooks rules (recommended-latest)
- React Refresh rules for Vite
- Configured in `eslint.config.js` (flat config format)

When making changes, always run `npm run lint` to catch issues.

### File Organization
- Use `.tsx` for components with JSX
- Use `.ts` for utilities and non-JSX code
- Keep components in `src/components/`
- Keep utilities in `src/lib/`
- Use named exports for components

## PF2E Game Data

The `public/data/` directory contains the full Pathfinder 2E game system from Foundry VTT. Key concepts:

### Game Mechanics Modules
- **`module/dc.ts`** - Difficulty Class calculations (standard and "Proficiency Without Level" variant)
- **`module/data.ts`** - Core data types (Rarity, etc.)
- **`module/model.ts`** - Data models
- Tests for these are in `public/data/tests/module/`

### DC System
The game uses a sophisticated DC (Difficulty Class) system with:
- Level-based DCs (from level -1 to 25)
- Adjustments: incredibly-easy, very-easy, easy, normal, hard, very-hard, incredibly-hard
- Rarity modifiers: common, uncommon, rare, unique
- Simple DCs based on proficiency rank
- Support for "Proficiency Without Level" variant rules

### Testing
Test files exist in `public/data/tests/` using a `describe`/`test`/`expect` syntax. However, there is **no test runner configured in package.json** yet. The tests appear to be written for a test framework (likely Jest or Vitest) but the runner is not set up.

## Notes for AI Assistants

- The React Compiler is enabled, which may impact dev/build performance but provides automatic optimization
- When working with game mechanics, refer to the PF2E source in `public/data/src/module/`
- The app currently fetches "instruments" from Supabase - this appears to be a placeholder/example
- Import aliases use `@/` prefix (e.g., `import { cn } from "@/lib/utils"`)
- The project is in early stages - only basic UI structure is set up
