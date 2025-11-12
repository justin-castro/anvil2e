/**
 * Generate manifest of all Foundry VTT pack files
 * Run with: node scripts/generate-manifest.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packsDir = path.join(__dirname, '../public/data/packs')
const outputFile = path.join(__dirname, '../public/data/manifest.json')

const CORE_PACKS = [
  'ancestries',
  'backgrounds',
  'classes',
  'classfeatures',
  'feats',
  'spells',
  'equipment',
  'actions',
]

const manifest = {}

for (const packName of CORE_PACKS) {
  const packPath = path.join(packsDir, packName)
  
  if (!fs.existsSync(packPath)) {
    console.warn(`⚠️  Pack directory not found: ${packName}`)
    continue
  }
  
  const files = fs.readdirSync(packPath)
    .filter(f => f.endsWith('.json') && !f.includes('Zone.Identifier'))
  
  manifest[packName] = files
  console.log(`✅ ${packName}: ${files.length} files`)
}

fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2))
console.log(`\n✅ Manifest written to ${outputFile}`)
console.log(`📦 Total packs: ${Object.keys(manifest).length}`)
console.log(`📄 Total files: ${Object.values(manifest).flat().length}`)
