import express from 'express'
import db from './db.js'

const app = express()
app.use(express.json({ limit: '5mb' }))

const STATUSES = ['idea', 'scripted', 'filmed', 'edited', 'published']

const FIELDS = ['format', 'project', 'type', 'working_title', 'opening_visual', 'status', 'slot', 'notes', 'target_release_date', 'script']
const FORMATS = ['short', 'long']

function validate({ project, status, format, target_release_date }, partial = false) {
  if (!partial || project !== undefined) {
    if (typeof project !== 'string' || !project.trim()) return 'project is required'
  }
  if (format !== undefined && !FORMATS.includes(format)) return 'format must be short or long'
  if (target_release_date != null && !/^\d{4}-\d{2}-\d{2}$/.test(target_release_date)) {
    return 'target_release_date must be YYYY-MM-DD'
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    return `status must be one of: ${STATUSES.join(', ')}`
  }
  return null
}

app.get('/api/videos', (req, res) => {
  // Scripts can be large and the list doesn't show them.
  res.json(db.prepare('SELECT * FROM videos ORDER BY position, id').all().map(({ script: _script, ...v }) => v))
})

app.get('/api/videos/:id', (req, res) => {
  const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id)
  if (!video) return res.status(404).json({ error: 'not found' })
  res.json(video)
})

app.post('/api/videos', (req, res) => {
  const error = validate(req.body)
  if (error) return res.status(400).json({ error })
  const {
    format = 'short',
    project,
    type = format === 'short' ? 'Alter' : '',
    working_title = null,
    opening_visual = null,
    status = 'idea',
    slot = null,
    notes = null,
    target_release_date = null,
    script = null,
  } = req.body
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO videos (position, format, project, type, working_title, opening_visual, status, slot, notes, target_release_date, script)
       VALUES ((SELECT COALESCE(MAX(position), 0) + 1 FROM videos), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(format, project.trim(), type, working_title, opening_visual, status, slot, notes, target_release_date, script)
  res.status(201).json(db.prepare('SELECT * FROM videos WHERE id = ?').get(lastInsertRowid))
})

app.patch('/api/videos/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM videos WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'not found' })
  const error = validate(req.body, true)
  if (error) return res.status(400).json({ error })
  const next = { ...existing }
  for (const key of FIELDS) {
    if (req.body[key] !== undefined) next[key] = req.body[key]
  }
  db.prepare(
    `UPDATE videos SET format = ?, project = ?, type = ?, working_title = ?, opening_visual = ?, status = ?, slot = ?, notes = ?, target_release_date = ?, script = ?
     WHERE id = ?`,
  ).run(next.format, next.project, next.type, next.working_title, next.opening_visual, next.status, next.slot, next.notes, next.target_release_date, next.script, existing.id)
  res.json(db.prepare('SELECT * FROM videos WHERE id = ?').get(existing.id))
})

app.delete('/api/videos/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id)
  if (!changes) return res.status(404).json({ error: 'not found' })
  res.status(204).end()
})

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
