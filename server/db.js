import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dbPath = fileURLToPath(new URL('../data/app.db', import.meta.url))
mkdirSync(dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position INTEGER NOT NULL,
    project TEXT NOT NULL,
    type TEXT NOT NULL,
    working_title TEXT,
    opening_visual TEXT,
    status TEXT NOT NULL DEFAULT 'idea',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// Migrate older databases: videos used to be shorts only.
const columns = db.prepare('PRAGMA table_info(videos)').all().map((c) => c.name)
if (!columns.includes('format')) db.exec("ALTER TABLE videos ADD COLUMN format TEXT NOT NULL DEFAULT 'short'")
if (!columns.includes('slot')) db.exec('ALTER TABLE videos ADD COLUMN slot TEXT')
if (!columns.includes('target_release_date')) db.exec('ALTER TABLE videos ADD COLUMN target_release_date TEXT')
if (!columns.includes('script')) db.exec('ALTER TABLE videos ADD COLUMN script TEXT')
if (!columns.includes('notes')) db.exec('ALTER TABLE videos ADD COLUMN notes TEXT')

// Seed the initial plan on first run. Unwritten titles/visuals are NULL.
const SEED = [
  ['Quince jeans: basic waist take-in', 'Alter', 'Take In Jeans at the Waist', 'Pinching the waist gap at the back'],
  ['Navy blue henley from Quince: take it in', 'Alter', null, null],
  ['Garden blouse in green linen', 'From scratch', null, 'The green linen draped on a chair'],
  ['Boyfriend jeans: waist plus tapering the legs', 'Alter', "Baggy Boyfriend Jeans to Jeans I'd Wear", 'Baggy leg beside a slim fit'],
  ['Wrangler jeans: full size downsize', 'Alter', 'Can You Downsize Jeans a Full Size?', 'Holding the jeans against her body to show the excess'],
  ['Cedar pant in white denim', 'From scratch', null, 'The untouched white denim yardage'],
  ['Black Everlane jeans: take in, then re-dye', 'Alter + dye', 'Reviving Faded Black Jeans', 'Faded pair next to a dyed black swatch'],
  ['Too-tight Everlane jeans: side stripe to widen the hips', 'Alter', 'My Jeans Were Too Tight, So I Added a Stripe', 'The jeans that will not button'],
]

if (db.prepare('SELECT COUNT(*) AS n FROM videos').get().n === 0) {
  const insert = db.prepare(
    'INSERT INTO videos (position, project, type, working_title, opening_visual) VALUES (?, ?, ?, ?, ?)',
  )
  db.transaction(() => SEED.forEach((row, i) => insert.run(i + 1, ...row)))()
}

const LONG_SEED = [
  ["Cordless iron vs tailor's (gravity-fed) iron", 'Up next', 'Comparison video'],
  ['Studio tour', 'Up next', 'Her optimized sewing space'],
  ['Cheap sewing machine tune-up (working idea: make it "purr")', 'Up next', 'Title needs work; scope open (maintenance, upgrades, or both)'],
  ['Leveling up my sewing game', 'Later', 'Friction-reducing upgrades: pressing mat, cordless iron, fabric weights, new pins, wheels on the table for cord management. One video or several smaller ones is undecided'],
  ['Buying fabric online', 'Later', 'Good materials angle; possible title: How to Buy Fabric Online (Without Getting Burned)'],
]

if (db.prepare("SELECT COUNT(*) AS n FROM videos WHERE format = 'long'").get().n === 0) {
  const insert = db.prepare(
    "INSERT INTO videos (position, format, project, type, slot, notes) VALUES (?, 'long', ?, '', ?, ?)",
  )
  db.transaction(() => {
    let position = db.prepare('SELECT COALESCE(MAX(position), 0) AS p FROM videos').get().p
    for (const row of LONG_SEED) insert.run(++position, ...row)
  })()
}

export default db
