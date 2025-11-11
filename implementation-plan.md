# Anvil2e - PF2e Character Builder Implementation Plan

## Problem Statement

Build a **cinematic, offline-first** Pathfinder 2e character companion that feels like a premium tabletop app. Users should experience:
- **Instant load times** - Works offline, PWA-ready for web/mobile/desktop
- **Player-first control** - All data lives locally, never dependent on servers
- **Immersive design** - Dark UI with glassy panels, calm gradients, dynamic stat updates
- **Cross-device sync** - Optional cloud backup via Supabase when online
- **Professional exports** - One-page PDF sheets, Foundry VTT format, JSON
- **Realtime collaboration** - Optional group workspaces for GMs and parties

## Current State

### Existing Infrastructure
**File:** `src/App.tsx`
```tsx
// Minimal placeholder app fetching dummy "instruments" data from Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

**Available Tech Stack:**
- React 19.1 with React Compiler (auto-memoization)
- TypeScript 5.9 (strict mode)
- Vite 7.1 (fast HMR) + vite-plugin-pwa installed but **not configured**
- shadcn/ui (New York style) - only Button component added
- Tailwind CSS 4.1 with **dark mode ready** (oklch colors, glassy design system)
- TanStack Query (data fetching) - **not yet configured**
- React Router 7.9 - **not yet configured**
- Zustand (state management) - **not yet configured**
- Dexie (IndexedDB) - **installed but not used**
- Supabase - **basic client setup only**
- React Hook Form + Zod - **not yet used**
- Search: Fuse.js + MiniSearch - **ready for use**
- Additional: CodeMirror, SortableJS, Luxon (date handling)

**Note:** Dexie is installed. You mentioned PouchDB - we should **replace Dexie with PouchDB + PouchDB-Find** for better Supabase sync capabilities (CouchDB-compatible replication).

**Available Data:**
- `public/data/packs/` contains complete PF2e game data from Foundry VTT:
  - 49 ancestries (e.g., `human.json`, `elf.json`)
  - 27 classes (e.g., `fighter.json`, `wizard.json`)
  - 338 backgrounds (e.g., `acolyte.json`)
  - 5,779 feats (organized by type: ancestry, class, skill, archetype, etc.)
  - Spells, equipment, heritages, class features, etc.

**Data Format Example** (`public/data/packs/ancestries/human.json`):
```json
{
  "_id": "IiG7DgeLWYrSNXuX",
  "name": "Human",
  "system": {
    "boosts": {
      "0": { "value": ["cha", "con", "dex", "int", "str", "wis"] },
      "1": { "value": ["str", "dex", "con", "int", "wis", "cha"] }
    },
    "hp": 8,
    "speed": 25,
    "size": "med",
    "languages": { "value": ["common"] }
  }
}
```

**PF2e Game Mechanics Available:**
- DC calculation system (`public/data/src/module/dc.ts`)
- Proficiency ranks, rarity tiers, size system
- Full rules engine with predicates and active effects

## Proposed Implementation

### Phase 1: Foundation & Offline-First Architecture (Weeks 1-2)

#### 1.1 PWA Configuration
**Configure:** `vite.config.ts` with vite-plugin-pwa
- Service worker with offline caching strategy
- Cache all PF2e JSON data (49 ancestries, 27 classes, 5,779 feats, etc.)
- Cache UI assets and fonts
- Web manifest for installability (iOS/Android/Desktop)
- Workbox strategies: NetworkFirst for API, CacheFirst for game data

**Result:** App works 100% offline after first load, installable as native-feeling app

#### 1.2 Local Database Setup
**Decision:** Replace Dexie with **PouchDB**
- Better sync with Supabase (CouchDB protocol)
- Built-in conflict resolution
- Automatic replication when online
- Simpler API for our use case

**Create:** `src/lib/db/`
- `pouchdb.ts` - PouchDB instance configuration
  - `gamedata` - PF2e rules (read-only cache)
  - `characters` - User's character builds (sync-enabled)
  - `preferences` - UI settings, theme, favorites
- `sync.ts` - Supabase ↔ PouchDB replication logic
- `schema.ts` - TypeScript types for all documents

**Why:** Local-first means every operation works offline. PouchDB provides seamless online/offline transitions with automatic sync.

#### 1.3 Data Loading System
**Create:** `src/lib/data/`
- `loader.ts` - Parse JSON from `public/data/packs/`, populate PouchDB on first run
- `indexer.ts` - Build search indices (Fuse.js + MiniSearch) for fast queries
- `types.ts` - TypeScript types for Ancestry, Class, Background, Feat, etc.
- `query.ts` - Convenience functions for common queries (e.g., getAncestries(), getFeatsForLevel())

**Data Loading Flow:**
1. Check if `gamedata` DB is populated (version check)
2. If empty/outdated: Load all JSONs, parse, insert to PouchDB
3. Build search indices in memory
4. Mark data as cached with version number
5. Subsequent loads: instant from PouchDB

**Performance Target:** < 2s first load, < 200ms subsequent loads

#### 1.4 State Management Setup
**Create:** `src/stores/`
- `characterStore.ts` - Zustand store for **active** character (in-memory working state)
  - Selections flow through wizard steps
  - Real-time computed stats (AC, HP, saves, modifiers)
  - Validation state for each step
  - Auto-save to PouchDB on every change (debounced 500ms)
- `uiStore.ts` - UI state (persisted to PouchDB)
  - Theme: dark/light/auto
  - Panel states: expanded/collapsed
  - Tutorial progress
  - Recent searches, favorites

**Structure:**
```typescript
interface CharacterState {
  id: string;
  name: string;
  level: number;
  
  // Selections
  ancestry: Ancestry | null;
  heritage: Heritage | null;
  background: Background | null;
  class: Class | null;
  
  // Stats
  abilityScores: AbilityScores;
  hp: { current: number; max: number; temp: number };
  
  // Features
  selectedFeats: Feat[];
  classFeatures: ClassFeature[];
  
  // Computed (getters, not stored)
  ac: number;
  saves: { fortitude: number; reflex: number; will: number };
  skills: Record<string, SkillModifier>;
  
  // Actions
  selectAncestry: (ancestry: Ancestry) => void;
  applyAbilityBoost: (ability: Ability) => void;
  addFeat: (feat: Feat, slot: FeatSlot) => void;
  // ... auto-saves to PouchDB
}
```

**Pattern:** Zustand for working state, PouchDB for persistence, Supabase for optional cloud backup

#### 1.5 Router Configuration
**Create:** `src/routes/`
- `/` - Landing: character list or "Get Started" for new users
- `/builder` - Character creation wizard (step-by-step flow)
- `/builder/:id` - Edit existing character (resume wizard)
- `/sheet/:id` - Interactive character sheet (play mode)
- `/characters` - Character gallery (grid/list view)
- `/reference` - Rules browser (searchable compendium) - Phase 4
- `/group/:id` - Shared workspace (GM/party view) - Phase 4

**Setup:** React Router 7.9 with:
- Lazy loading per route (code splitting)
- Data loaders from PouchDB (instant, no loading spinners)
- Error boundaries with offline-friendly fallbacks

#### 1.6 Data Query Layer
**Configure:** TanStack Query for:
- **Local queries:** Ancestry/class/background lists from PouchDB (instant)
- **Realtime:** Supabase subscriptions for shared characters (optional)
- **Background sync:** Character backups to Supabase when online
- **Optimistic updates:** UI updates immediately, syncs in background

**Pattern:**
```typescript
// All queries use PouchDB first, Supabase as backup/sync
const { data: ancestries } = useQuery({
  queryKey: ['ancestries'],
  queryFn: () => db.gamedata.allDocs({ include_docs: true }),
  staleTime: Infinity, // Game data never stales
});
```

### Phase 2: Immersive Character Builder (Weeks 3-4)

#### 2.1 Step-by-Step Builder UI
**Create:** `src/components/builder/`
- `BuilderWizard.tsx` - Multi-step container with progress indicator
- `AncestryStep.tsx` - Ancestry + heritage selection with visual cards
- `BackgroundStep.tsx` - Background selection
- `ClassStep.tsx` - Class selection
- `AbilitiesStep.tsx` - Ability boost allocation with validation
- `SkillsStep.tsx` - Skill training
- `FeatsStep.tsx` - Feat selection with prerequisite checking
- `ReviewStep.tsx` - Final character summary

**Visual Design System:**
- **Dark-first UI:** Deep backgrounds (`oklch(0.145 0 0)`), glassy panels with blur
- **Calm gradients:** Subtle color transitions, no harsh edges
- **Glassy cards:** `backdrop-blur-lg`, subtle borders, shadow elevation
- **Typography:** Clear hierarchy, generous whitespace, readable at all sizes
- **Animations:** Smooth transitions (Framer Motion), respect `prefers-reduced-motion`
- **Icons:** Lucide React for UI, game icons from Foundry VTT data

**Interaction Patterns:**
- **Instant feedback:** Stats update as you make choices (no "save" button)
- **Progress indicators:** Visual stepper shows where you are in creation flow
- **Contextual help:** Expandable info panels, hover tooltips, inline examples
- **Keyboard shortcuts:** Arrow keys navigate, Enter selects, Esc cancels
- **Search everywhere:** Cmd/Ctrl+K global search (feats, spells, rules)

**User Experience Goals:**
- **Visual clarity:** Large, scannable cards with high-contrast text
- **Validation:** Real-time feedback, red/green indicators, blocking on invalid
- **Guidance:** Tutorial mode for new players, expert mode for veterans
- **Speed:** < 5 minutes to build a character, < 10 seconds per choice

#### 2.2 Ability Score Management
**Create:** `src/components/builder/abilities/`
- Drag-and-drop boost assignment
- Visual representation of base + boosts
- Ancestry/background/class boost integration
- Real-time stat preview with modifiers

#### 2.3 Feat Selection System
**Create:** `src/components/builder/feats/`
- `FeatBrowser.tsx` - Searchable, filterable feat list
  - Filter by type, level, traits, prerequisites
  - Search with Fuse.js fuzzy matching
- `FeatCard.tsx` - Expandable feat display with actions/benefits
- `PrerequisiteChecker.ts` - Validate feat eligibility
- `FeatSlots.tsx` - Visual slots for ancestry/class/skill/general feats

**Complexity:** Must handle feat chains (feat A requires feat B which requires feat C), level requirements, and dynamic prerequisites based on build choices.

### Phase 3: Interactive Character Sheet (Weeks 5-6)

#### 3.1 Live Character Sheet Display
**Create:** `src/components/sheet/`
- `CharacterSheet.tsx` - Full-screen sheet with **live stat updates**
  - HP tracker with visual bar (damage/heal with animations)
  - Spell slots (checkboxes, visual depletion)
  - Action economy indicators (1-action, 2-action, 3-action, reaction)
  - Conditions tracker (status effects with icons)
- `StatsPanel.tsx` - **Interactive stats**
  - Click AC to see breakdown (10 + DEX + armor + shield...)
  - Hover skills to see modifiers and proficiency
  - Roll buttons for saves/attacks (shows formula)
- `FeaturesPanel.tsx` - Expandable feature cards
  - Class features with usage tracking (daily, encounter)
  - Feats organized by type
  - Special abilities with descriptions
- `ActionsPanel.tsx` - **Action cards**
  - Strike, Cast Spell, Stride, etc.
  - Shows action cost, traits, effects
  - Quick reference for combat

**Sheet Modes:**
- **Overview:** One-page summary (name, portrait, key stats)
- **Combat:** HP, AC, saves, actions, conditions (optimized for play)
- **Details:** Full feature list, feats, inventory
- **Spells:** Spell list with prepared/spontaneous tracking
- **Print:** Printer-friendly layout (CSS @media print)

**Design Inspiration:** Glassy panels, stat cards that feel "alive" with hover states and smooth updates

#### 3.2 Character Library
**Create:** `src/components/characters/`
- `CharacterList.tsx` - **Cinematic character gallery**
  - Grid view: Portrait cards with name, level, class icon
  - List view: Compact rows with key stats
  - Sort: by name, level, last played, creation date
  - Filter: by class, level range, favorite
  - Search: fuzzy search by name
- `CharacterCard.tsx` - **Premium card design**
  - Portrait/avatar (uploaded or default icon)
  - Level badge, class icon, ancestry name
  - Quick stats: HP, AC, level
  - Action buttons: Play, Edit, Duplicate, Delete, Export
  - Last modified timestamp
  - Sync status indicator (cloud icon: synced/syncing/offline)
- **Storage flow:**
  - All characters in PouchDB `characters` database
  - Auto-sync to Supabase when online (background, non-blocking)
  - Conflict resolution: last-write-wins (timestamp-based)
  - Offline indicator: shows when working offline
- **Export options:**
  - PDF: One-page official-style sheet (browser print dialog)
  - JSON: Character data for sharing/backup
  - Foundry VTT: Export as actor JSON (compatible with Foundry import)

#### 3.3 Level-Up System
**Create:** `src/components/levelup/`
- `LevelUpWizard.tsx` - Guide through level advancement
- Automatic HP increase
- Feat selection at appropriate levels
- Ability boost at levels 5, 10, 15, 20
- Class feature acquisition

### Phase 4: Premium Features & Collaboration (Weeks 7-8)

#### 4.1 Build Optimization Tools
**For min-maxers:**
- `BuildAnalyzer.tsx` - DPR calculator, AC optimization
- `FeatPathfinder.tsx` - Suggest feat progression paths
- Build templates/presets
- Compare builds side-by-side

#### 4.2 Storytelling Features
**For narrative players:**
- Character portrait upload
- Background story notes (rich text editor)
- Session journals with date tracking
- NPC relationship tracker
- Quest log

#### 4.3 Realtime Collaboration
**For game masters and parties:**
- `GroupWorkspace.tsx` - Shared character view
  - GM creates workspace, invites players via link
  - Players share characters to workspace
  - Supabase Realtime: see character updates live
  - Party overview: all characters side-by-side
  - GM can view any character sheet (read-only)
- **Permissions:**
  - Owner: full edit
  - GM: read-only view of all party characters
  - Players: can only see own character + party overview
- **Use cases:**
  - GM checks player stats during session (no asking for AC)
  - Players see party composition for planning
  - Share loot, track party resources

#### 4.4 Search & Reference
**Create:** `src/components/reference/`
- Unified search across feats, spells, equipment
- Filter by source book, level, rarity
- Bookmarking system
- Build-specific filtering (show only valid options)

### Phase 5: Polish, Performance & Onboarding (Weeks 9-10)

#### 5.1 Cinematic Onboarding
- **First launch:**
  - Animated splash screen with Anvil2e logo
  - Data initialization: "Loading Pathfinder 2e rules..." with progress bar
  - Quick tutorial: "Swipe to navigate, tap to select, search anytime"
- **Guided tour:** Interactive walkthrough of builder steps
- **Sample characters:** 5 pre-built characters (Fighter, Wizard, Rogue, Cleric, Ranger)
- **Mode toggle:** Beginner (help panels) vs Expert (minimal UI)
- **Video tutorials:** Embedded YouTube links for key features

#### 5.2 Accessibility
- ARIA labels for screen readers
- Keyboard navigation throughout
- High contrast mode option
- Reduced motion option

#### 5.3 Performance Optimization
- **Code splitting:**
  - Lazy load routes with React.lazy()
  - Separate bundles: builder, sheet, reference
  - Dynamic imports for heavy components
- **Virtual scrolling:**
  - Use `react-virtual` for feat lists (5,779 items)
  - Render only visible items + buffer
- **Asset optimization:**
  - Lazy load character portraits
  - Use WebP for images (with PNG fallback)
  - Icon sprites for common UI icons
- **Database performance:**
  - PouchDB indices on commonly queried fields (type, level, traits)
  - Batch queries for related data
  - In-memory cache for search indices
- **Animation performance:**
  - Use CSS transforms (GPU-accelerated)
  - Debounce rapid updates (ability scores)
  - RequestAnimationFrame for smooth scrolls
- **PWA optimization:**
  - Precache critical assets (fonts, UI icons, core data)
  - Cache-first for game data, NetworkFirst for user data
  - Background sync for character updates

**Performance Targets:**
- Lighthouse score: 90+ (Performance, Accessibility, Best Practices)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Offline functionality: 100% feature parity

#### 5.4 Testing & Validation
- Unit tests for character validation logic
- Integration tests for feat prerequisites
- E2E tests for critical paths (create character, level up)
- Cross-browser testing

## Technical Decisions

### Offline-First Architecture
**Philosophy:** Every feature works offline. Online is enhancement, not requirement.

1. **PouchDB as single source of truth** (local-first)
   - `gamedata` DB: PF2e rules (read-only, versioned)
   - `characters` DB: User's builds (read-write, sync-enabled)
   - `preferences` DB: UI settings, favorites
2. **Supabase as cloud backup** (optional, best-effort)
   - Automatic replication when online
   - Conflict resolution: last-write-wins
   - Users can disable sync entirely (privacy)
3. **Service Worker caches everything**
   - Game data JSONs (~50MB)
   - UI assets, fonts, icons
   - Character portraits (lazy-loaded)
   - API responses (short TTL)

### Data Flow
```
User Action → Zustand Store → PouchDB (immediate) → Supabase (background)
                    ↓
              UI Updates (instant)
```

**Why this matters:**
- **Zero dependency on network:** App never "hangs" waiting for API
- **Instant UI updates:** No loading spinners for character changes
- **Auto-sync magic:** Users don't think about saving/loading
- **Offline play sessions:** Take your sheet camping, on planes, anywhere

### State Management Pattern
1. **React state:** Ephemeral UI (modals, tooltips, hover states)
2. **Zustand:** Active character (working state, computed stats)
3. **PouchDB:** Persistence layer (all documents, synced)
4. **TanStack Query:** Bridge between PouchDB and React (caching, invalidation)
5. **Supabase Realtime:** Optional collaborative features (group workspaces)

### Component Architecture
```
src/
├── components/
│   ├── builder/        # Creation wizard (step-by-step)
│   ├── sheet/          # Interactive character sheet
│   ├── characters/     # Character library
│   ├── reference/      # Rules browser & search
│   ├── group/          # Collaborative workspace
│   └── ui/             # shadcn/ui + custom glassy components
├── lib/
│   ├── db/             # PouchDB setup & sync
│   ├── data/           # Data loading & indices
│   ├── validation/     # Character rules engine
│   ├── export/         # PDF, JSON, Foundry VTT
│   └── utils/          # Helpers
├── stores/             # Zustand stores
├── routes/             # React Router pages
├── workers/            # Service worker (PWA)
└── styles/             # Glassy theme system
```

### Form Validation Strategy
- **Zod schemas** for each step of character creation
- **React Hook Form** for complex multi-field forms (ability scores, skills)
- **Real-time validation** with error messages
- **Prevent progression** until step is valid

## Success Metrics

1. **Offline functionality:** 100% feature parity (no "online-only" features)
2. **Speed:** Character creation in < 5 minutes for experienced users
3. **Load time:** < 2s first launch, < 0.5s subsequent launches
4. **Interactions:** < 100ms response time for all user actions
5. **PWA install rate:** > 30% of users install as app
6. **Sync reliability:** 99.9% successful syncs when online
7. **Accuracy:** 100% rules compliance for core character options
8. **Accessibility:** WCAG 2.1 AA compliance
9. **User satisfaction:** "Feels like a native app" feedback

## Open Questions

1. **PouchDB vs Dexie trade-off:**
   - PouchDB: Better sync, more dependencies, larger bundle
   - Dexie: Already installed, no sync, simpler API
   - **Recommendation:** Switch to PouchDB for sync capabilities

2. **Supabase schema:**
   - Store full character JSON as JSONB column?
   - Or normalize to tables (ancestries, classes, etc.)?
   - **Recommendation:** JSONB for flexibility, indices for queries

3. **Authentication:**
   - Required for cloud sync? Or anonymous with device ID?
   - **Recommendation:** Optional email/password, anonymous mode works fully

4. **PDF generation:**
   - Browser print dialog (CSS @media print)?
   - Or library like jsPDF/Puppeteer?
   - **Recommendation:** CSS print first, library as fallback

5. **Spell/inventory tracking:**
   - Full management (prepared, cast, consumables)?
   - Or basic list?
   - **Recommendation:** Start simple, expand in Phase 4

6. **Realtime collaboration complexity:**
   - Supabase Realtime (simpler, fewer features)?
   - Or WebRTC (full P2P, more complex)?
   - **Recommendation:** Supabase Realtime for MVP

7. **Mobile app strategy:**
   - PWA only?
   - Or Capacitor/Tauri for native builds?
   - **Recommendation:** PWA first, native if demand exists

## Dependencies to Add

**Required for Phase 1:**
```bash
npm install pouchdb pouchdb-find pouchdb-adapter-idb
npm install -D @types/pouchdb
```

**Optional (recommend Phase 2+):**
```bash
npm install framer-motion  # Smooth animations
npm install react-virtual  # Virtual scrolling
npm install @react-pdf/renderer  # PDF generation (if CSS print insufficient)
```

**To Remove:**
```bash
npm uninstall svelte  # Not using Svelte
```

## Visual Design System

**Theme inspiration:**
- **Colors:** Dark oklch palette already configured
- **Glass effect:** `backdrop-blur-lg` + `bg-white/5` + `border-white/10`
- **Shadows:** Multi-layer with colored tints
- **Gradients:** Radial from top-left, subtle color shifts
- **Typography:** System fonts, clear hierarchy

**Component patterns:**
```tsx
// Glassy card
className="
  backdrop-blur-lg bg-white/5 dark:bg-white/5
  border border-white/10
  rounded-xl shadow-2xl
  hover:bg-white/10 transition-all duration-300
"

// Stat card
className="
  bg-gradient-to-br from-primary/20 to-primary/5
  border-l-4 border-primary
  p-4 rounded-lg
  hover:scale-105 transition-transform
"
```

## Next Steps

**Phase 1 - Week 1 (Foundation):**
1. ✅ Configure vite-plugin-pwa with service worker
2. ✅ Replace Dexie with PouchDB + setup sync
3. ✅ Build data loader (JSONs → PouchDB)
4. ✅ Configure TanStack Query with PouchDB
5. ✅ Set up React Router with lazy loading
6. ✅ Create base glassy theme components

**Phase 1 - Week 2 (State & Data):**
7. ✅ Zustand character store with auto-save
8. ✅ Build search indices (Fuse.js)
9. ✅ Supabase sync implementation
10. ✅ PWA manifest and icons
11. ✅ Test offline functionality

**Waiting for approval before:**
- Installing PouchDB (breaking change from Dexie)
- Configuring service worker
- Writing any component code
- Committing to sync architecture

### Phase 6: Power User Features (Weeks 11-14)

#### 6.1 VTT Integration (Foundry + Roll20)
**Problem:** Users want to use their characters in online gameplay

**Foundry VTT Export/Import:**
- **Data format:** Already compatible! Our data IS Foundry VTT format
  - `public/data/tests/fixtures/characterData.json` shows full actor structure
  - Actor type: `"character"`, includes abilities, saves, HP, skills, etc.
- **Export:** `src/lib/export/foundry.ts`
  - Map our character store to Foundry actor JSON
  - Include embedded items (feats, equipment, spells)
  - Generate proper `_id` fields, `system` structure
- **Import:** Parse Foundry VTT actor JSON, populate our character store
  - Reverse mapping: Foundry → Anvil2e internal format
  - Validate data, fill in missing fields
  - Show diff of changes (for version compatibility)

**Roll20 Export:**
- **Character sheet format:** Roll20 uses different JSON structure
- **Research needed:** Roll20 API for character import (may require manual CSV)
- **Fallback:** Export as Pathfinder 2E-formatted JSON for manual import

**Create:** `src/lib/export/`
- `foundry.ts` - Bidirectional Foundry VTT conversion
- `roll20.ts` - Roll20 character sheet export
- `types.ts` - TypeScript types for VTT formats

#### 6.2 Homebrew System
**Problem:** Players and GMs want custom content

**Architecture:**
- **Homebrew as first-class data:** Same structure as official content
- **Storage:** PouchDB `homebrew` database (separate from core `gamedata`)
- **Sharing:** Supabase "Homebrew Hub" table (public, searchable)

**Create:** `src/components/homebrew/`
- `HomebrewEditor.tsx` - Form-based editor for custom content
  - Class editor: name, HP, proficiencies, class features
  - Ancestry editor: boosts, flaws, HP, speed, traits
  - Item editor: stats, properties, runes, bulk
  - Feat editor: prerequisites, actions, effects
- `HomebrewBrowser.tsx` - Search/download community homebrew
  - Filter by type, author, rating, tags
  - Preview before downloading
  - One-click install to local PouchDB
- `HomebrewValidator.ts` - Ensure homebrew follows PF2e rules
  - Check feat prerequisites are valid
  - Validate stat ranges (HP > 0, ability scores 1-30, etc.)
  - Warn on missing required fields

**Supabase Schema:**
```sql
create table homebrew_packs (
  id uuid primary key,
  user_id uuid references auth.users,
  name text,
  description text,
  type text, -- 'ancestry', 'class', 'feat', 'item'
  data jsonb, -- Full item data
  downloads int default 0,
  rating numeric,
  tags text[],
  created_at timestamp default now()
);
```

**Publishing Flow:**
1. User creates homebrew content in editor
2. Saves to local PouchDB `homebrew` database
3. Optionally publishes to Supabase "Homebrew Hub"
4. Other users browse, download, use in their builds

#### 6.3 Campaign Management
**Problem:** GMs need to track parties, encounters, XP

**Create:** `src/components/campaign/`
- `CampaignDashboard.tsx` - GM view of active campaign
  - Party roster with live character stats
  - Session log (date, XP awarded, notes)
  - Encounter tracker (initiative, HP, conditions)
- `PartySheet.tsx` - Overview of all characters
  - Side-by-side stat comparison
  - Click character card → full sheet modal
  - Party-wide stats (total HP, average AC, skill coverage)
- `EncounterBuilder.tsx` - Build encounters from bestiary
  - Add creatures from `public/data/packs/` bestiaries
  - Calculate XP budget, difficulty
  - Track initiative order, HP, conditions
  - Award XP at end → sync to character sheets
- `XPTracker.tsx` - Manage XP awards
  - Award XP to entire party or individuals
  - Auto-level characters at milestones
  - XP history log

**Supabase Schema:**
```sql
create table campaigns (
  id uuid primary key,
  gm_id uuid references auth.users,
  name text,
  description text,
  created_at timestamp default now()
);

create table campaign_members (
  campaign_id uuid references campaigns,
  character_id uuid, -- Character from PouchDB
  role text, -- 'gm' or 'player'
  joined_at timestamp default now(),
  primary key (campaign_id, character_id)
);

create table campaign_sessions (
  id uuid primary key,
  campaign_id uuid references campaigns,
  date date,
  xp_awarded jsonb, -- { character_id: xp }
  notes text,
  created_at timestamp default now()
);
```

**Realtime Features:**
- GM updates character XP → players see it live
- Player updates character sheet → GM sees changes immediately
- Uses Supabase Realtime subscriptions

#### 6.4 Player Dashboard
**Problem:** Players have multiple characters, need history

**Create:** `src/routes/dashboard/`
- `Dashboard.tsx` - Landing page after login
  - **Characters section:** Grid of all saved characters
  - **Recent activity:** "Leveled up Valeros to 5", "Added Fireball spell"
  - **Play history:** Sessions played, campaigns joined
  - **Notes:** Free-form notes per character (session summaries, goals)
- `NotesPanel.tsx` - Rich text notes editor
  - Uses TipTap or similar for formatting
  - Attached to character or campaign
  - Auto-save to PouchDB
- `PlayHistory.tsx` - Session log
  - Date, campaign, XP gained, level ups
  - Links to full session notes

**PouchDB Schema:**
```typescript
interface Note {
  _id: string;
  character_id: string;
  title: string;
  content: string; // HTML or markdown
  created_at: string;
  updated_at: string;
}

interface PlaySession {
  _id: string;
  character_id: string;
  campaign_id?: string;
  date: string;
  xp_gained: number;
  notes: string;
}
```

#### 6.5 AI Integration (Free Local + Optional Premium)
**Problem:** New players need rules help, veterans want build optimization

**Use Cases:**
1. **Rules lookup:** "How does flanking work?" → Search PF2e rules, return answer
2. **Build suggestions:** "Recommend feats for DEX fighter" → Analyze synergies
3. **Feat chains:** "Show me path to Whirlwind Strike" → Display prerequisite tree
4. **Optimization tips:** "Your AC is low for level 5" → Suggest armor upgrades

**Implementation Strategy: Hybrid (Free Local + Optional Premium)**

**Default: Free Local LLM (No API Keys Required)**
- Use **WebLLM** or **Transformers.js** to run models in browser
- Models: Phi-3-mini (2.7B), Llama 3.2 (1B/3B), or Gemma 2 (2B)
- Download once, cache in browser (~2-3GB), runs offline
- **Pros:** Free, private, works offline, no API keys
- **Cons:** Slower first load (model download), lower quality answers

**Optional: User's Own API Keys (Premium Quality)**
- Users can provide their own OpenAI, Anthropic, or Groq API keys
- Stored locally (localStorage or PouchDB), never sent to our servers
- **Pros:** Better answers, faster inference, lower bandwidth
- **Cons:** User pays for their own usage

**RAG (Retrieval Augmented Generation) Pipeline:**
1. **Index PF2e rules** (one-time, offline)
   - Extract text from `public/data/packs/` (feats, spells, rules)
   - Use MiniSearch (already installed!) for keyword search
   - Generate embeddings with lightweight model (optional, for semantic search)
   - Store in PouchDB `rules_index` database

2. **User query flow:**
   - User asks: "What feats should I take for a DEX fighter?"
   - **Step 1:** Keyword search in indexed rules (fast, offline)
   - **Step 2:** Retrieve top 5-10 relevant rules
   - **Step 3:** Pass to LLM (local or API) with context
   - **Step 4:** LLM generates answer, returns to user

3. **Caching:**
   - Common queries cached in PouchDB ("What is flanking?" → stored answer)
   - Reduces LLM calls, improves speed

**Create:** `src/lib/ai/`
- `engine.ts` - Core AI engine (manages local vs API)
- `local-llm.ts` - WebLLM integration (Phi-3, Llama)
- `api-client.ts` - API clients (OpenAI, Anthropic, Groq)
- `rag.ts` - RAG pipeline (search + generate)
- `indexer.ts` - Index PF2e rules on first load
- `cache.ts` - Query cache management
- `types.ts` - TypeScript types for AI responses

**Create:** `src/components/ai/`
- `AISettings.tsx` - Choose local vs API, enter API keys
  - Toggle: "Use local AI (free, slower)" vs "Use my API key (faster)"
  - API key input fields (never sent to our servers)
  - Model selection dropdown
- `AIChat.tsx` - Chat interface for questions
  - Cmd+K opens, type question, get answer
  - Shows context sources ("From feat: Power Attack")
  - "Ask follow-up" button
- `BuildAssistant.tsx` - Inline suggestions during character creation
  - "This feat synergizes with Power Attack" tooltip
  - "Recommended feats for your build" panel
- `RulesLookup.tsx` - Quick rules reference
  - Search bar for rules, AI-enhanced results

**UI Integration:**
- `Cmd+K` global search → includes "Ask AI" option
- "Ask AI" button on complex forms (feat selection, spell choice)
- Inline tooltips with AI suggestions ("This feat synergizes with X")
- Settings page: AI model selection, API key management

**Privacy & Transparency:**
- **Default mode:** 100% local, zero data leaves device
- **API mode:** User's API key, user pays, we never see queries
- Clear indicator: "Using local AI" vs "Using OpenAI (your key)"
- All AI features can be disabled entirely in settings

## Phase 6 Implementation Notes

### Foundry VTT Compatibility
**Current state:** We already have Foundry VTT data structure
- Example: `public/data/tests/fixtures/characterData.json`
- Actor schema matches Foundry's `system` property structure
- Items (feats, equipment) use same IDs and structure

**Export process:**
1. Take character from Zustand store
2. Map to Foundry actor JSON format
3. Include embedded items
4. User downloads JSON file
5. In Foundry: "Import Data" → paste JSON → character appears

**Import process:**
1. User uploads Foundry actor JSON
2. Parse and validate structure
3. Map to our internal format
4. Show preview: "Importing level 5 Fighter 'Valeros'"
5. Confirm → saves to PouchDB

### Homebrew Content Security
**Risks:** Malicious homebrew could break character sheets

**Mitigations:**
1. **Validation:** Check all fields match expected schema
2. **Sandboxing:** Homebrew can't execute code, only data
3. **Reporting:** Users can flag malicious content
4. **Moderation:** GMs/admins can review flagged homebrew
5. **Local-first:** Homebrew stored locally, user controls what they download

### Campaign Sync Architecture
**Challenge:** Multiple players editing characters, GM viewing in realtime

**Solution:**
- Characters stay in player's PouchDB (they own the data)
- Campaign membership references character IDs
- Supabase Realtime broadcasts changes
- GM subscribes to all party character updates
- Conflict resolution: player's local changes always win

**Flow:**
1. Player joins campaign (shares character ID with GM)
2. GM's app subscribes to character updates via Supabase
3. Player edits character → PouchDB saves → broadcasts change
4. GM's app receives update → refreshes that character's stats
5. GM awards XP → broadcasts to all players → they update locally

### AI Integration Implementation

**Architecture Decision: Local-First with Optional Premium**

**Phase 1: Local LLM (Free, Default)**
- **Library:** WebLLM (https://github.com/mlc-ai/web-llm)
  - Runs LLMs in browser via WebGPU/WebAssembly
  - Models: Phi-3-mini (2.7B), Llama 3.2 (1B/3B)
  - One-time download: ~2-3GB, cached in browser
- **Alternative:** Transformers.js (Hugging Face)
  - Lighter weight, less powerful
  - Models: DistilBERT, BERT-tiny for embeddings
  - Good for semantic search, not great for chat

**Phase 2: RAG Pipeline (Offline)**
- **Index PF2e rules:**
  - Parse JSON from `public/data/packs/`
  - Extract text: feat descriptions, spell text, rules
  - MiniSearch (already installed) for keyword search
  - Optional: Generate embeddings with local model
- **Query processing:**
  - User query → MiniSearch → top 10 results
  - Results + query → LLM → answer
  - Cache common queries in PouchDB

**Phase 3: API Integration (Optional, User's Keys)**
- **Supported APIs:**
  - OpenAI (GPT-4o, GPT-4o-mini)
  - Anthropic (Claude 3.5 Sonnet, Claude 3 Haiku)
  - Groq (fast inference, free tier)
  - Google Gemini (free tier available)
- **Key storage:** localStorage (encrypted if possible), never sent to our backend
- **User pays:** We don't handle billing, user uses their own API credits

**Performance Targets:**
- **Local LLM:** First query 10-15s (model init), subsequent <5s
- **API:** <2s per query (depends on user's API)
- **Cached queries:** <100ms (instant)

**Bundle Size Impact:**
- WebLLM library: ~500KB (minified)
- Model files: 2-3GB (cached, not in bundle)
- Total app bundle increase: <1MB

**User Experience:**
1. **First-time setup:**
   - "Download AI model for offline help? (2.5GB, one-time)"
   - Downloads in background while user builds character
   - Fallback: keyword search only until download completes
2. **Ongoing usage:**
   - Cmd+K → "Ask AI", instant (model already loaded)
   - Inline suggestions as user builds character
3. **Power users:**
   - Settings → "Use my API key" → paste key → faster responses
   - Choose model: GPT-4o (best), GPT-4o-mini (cheap), Claude 3.5 (smart)

**Cost Analysis (User's API Keys):**
- **OpenAI GPT-4o-mini:** ~$0.002 per query (1K in + 500 out)
  - 1,000 queries = $2 (very affordable)
- **Groq (Llama 3.2):** Free tier: 14,400 queries/day
  - Effectively free for personal use
- **Google Gemini:** 1,500 queries/day free
  - Also effectively free

**Recommendation:** 
- **Phase 6.5 (Week 12):** Implement local LLM + RAG
- **Phase 6.6 (Week 13):** Add API integration for power users
- **Phase 6.7 (Week 14):** Polish AI UX, add build assistant

---

**Last Updated:** 2025-11-11 (Added Phase 6: Power User Features)
**Status:** Awaiting approval for revised plan
**Estimated Timeline:** 14 weeks to full feature set (10 weeks to MVP)
**MVP Target:** Phase 3 complete (6 weeks) = usable character builder + sheet
**Full Launch:** Phase 5 complete (10 weeks) = polished, PWA-ready
**Power Users:** Phase 6 complete (14 weeks) = VTT integration, homebrew, campaigns, AI
