import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ScriptEditor from './ScriptEditor.jsx'
import { api, STATUSES, TYPES, SLOTS, FORMATS } from './api.js'

// Fields stored as NULL when left blank.
const NULLABLE = ['working_title', 'opening_visual', 'slot', 'notes', 'target_release_date', 'script']

function VideoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(null) // last version confirmed by the server
  const [draft, setDraft] = useState(null) // what the inputs show
  const [state, setState] = useState('loading') // loading | ready | missing
  const [save, setSave] = useState({ status: 'idle', message: '' })

  useEffect(() => {
    api(`/${id}`)
      .then((v) => {
        setSaved(v)
        setDraft(v)
        setState('ready')
      })
      .catch(() => setState('missing'))
  }, [id])

  async function commit(field, raw) {
    const value = NULLABLE.includes(field) && raw === '' ? null : raw
    if (value === saved[field]) return
    if (field === 'project' && !String(value).trim()) {
      setDraft((d) => ({ ...d, project: saved.project }))
      setSave({ status: 'error', message: 'Title can’t be empty.' })
      return
    }
    setSave({ status: 'saving', message: 'Saving…' })
    try {
      const updated = await api(`/${id}`, { method: 'PATCH', body: JSON.stringify({ [field]: value }) })
      setSaved(updated)
      setDraft((d) => ({ ...d, [field]: updated[field] }))
      setSave({ status: 'saved', message: 'All changes saved' })
    } catch (e) {
      setDraft((d) => ({ ...d, [field]: saved[field] }))
      setSave({ status: 'error', message: `Couldn’t save: ${e.message}` })
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${saved.project}"?`)) return
    try {
      await api(`/${id}`, { method: 'DELETE' })
      navigate('/')
    } catch (e) {
      setSave({ status: 'error', message: `Couldn’t delete: ${e.message}` })
    }
  }

  if (state === 'loading') return <main><p>Loading…</p></main>
  if (state === 'missing') {
    return (
      <main>
        <p><Link to="/">← All videos</Link></p>
        <p>Video not found.</p>
      </main>
    )
  }

  const isShort = draft.format === 'short'
  const text = (field) => ({
    value: draft[field] ?? '',
    onChange: (e) => setDraft({ ...draft, [field]: e.target.value }),
    onBlur: (e) => commit(field, e.target.value),
  })
  const select = (field) => ({
    value: draft[field] ?? '',
    onChange: (e) => {
      setDraft({ ...draft, [field]: e.target.value })
      commit(field, e.target.value)
    },
  })

  return (
    <main className="video-page">
      <p><Link to="/">← All videos</Link></p>

      <label>
        {isShort ? 'Project' : 'Video'}
        <input className="title-input" {...text('project')} />
      </label>

      <div className="grid">
        <label>
          Format
          <select {...select('format')}>
            {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <label>
          Status
          <select {...select('status')}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Target release date
          <input type="date" {...select('target_release_date')} />
        </label>
        {isShort ? (
          <label>
            Type
            <select {...select('type')}>
              {[...new Set([...TYPES, draft.type].filter(Boolean))].map((t) => <option key={t}>{t}</option>)}
              {!draft.type && <option value="">—</option>}
            </select>
          </label>
        ) : (
          <label>
            Slot
            <select {...select('slot')}>
              <option value="">—</option>
              {SLOTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        )}
      </div>

      {isShort && (
        <>
          <label>
            Working title
            <input {...text('working_title')} placeholder="(to write)" />
          </label>
          <label>
            Opening visual
            <textarea rows={2} {...text('opening_visual')} placeholder="(to plan)" />
          </label>
        </>
      )}
      <label>
        Notes
        <textarea rows={6} {...text('notes')} />
      </label>

      <div className="field">
        <span id="script-label" className="label">Script</span>
        <ScriptEditor
          labelledBy="script-label"
          initialHtml={saved.script}
          onSave={(html) => commit('script', html)}
        />
      </div>

      <div className="footer">
        <span role="status" className={save.status === 'error' ? 'error' : 'muted'}>{save.message}</span>
        <button type="button" onClick={remove}>Delete video</button>
      </div>
    </main>
  )
}

export default VideoPage
