import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, STATUSES, TYPES, SLOTS, FORMATS } from './api.js'

function Placeholder({ value, text }) {
  return value ? value : <span className="muted">{text}</span>
}

function VideoList() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [format, setFormat] = useState('short')
  const [form, setForm] = useState({ project: '', type: TYPES[0], slot: SLOTS[0] })
  const isShort = format === 'short'
  const shown = videos.filter((v) => v.format === format)

  useEffect(() => {
    api('')
      .then(setVideos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function run(action) {
    setError('')
    try {
      await action()
    } catch (e) {
      setError(e.message)
    }
  }

  const add = (e) => {
    e.preventDefault()
    run(async () => {
      const created = await api('', { method: 'POST', body: JSON.stringify({ ...form, format }) })
      setVideos((v) => [...v, created])
      setForm((f) => ({ ...f, project: '' }))
    })
  }

  const setStatus = (id, status) =>
    run(async () => {
      const updated = await api(`/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setVideos((v) => v.map((x) => (x.id === id ? updated : x)))
    })

  const remove = (video) => {
    if (!window.confirm(`Delete "${video.project}"?`)) return
    run(async () => {
      await api(`/${video.id}`, { method: 'DELETE' })
      setVideos((v) => v.filter((x) => x.id !== video.id))
    })
  }

  return (
    <main>
      <h1>Video plan</h1>
      <div role="tablist" className="tabs">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={format === f.id}
            onClick={() => setFormat(f.id)}
          >
            {f.label} ({videos.filter((v) => v.format === f.id).length})
          </button>
        ))}
      </div>
      {error && <p role="alert" className="error">{error}</p>}

      <form onSubmit={add} className="add">
        <input
          value={form.project}
          onChange={(e) => setForm({ ...form, project: e.target.value })}
          placeholder={isShort ? 'New project' : 'New video'}
          aria-label={isShort ? 'New project' : 'New video'}
          required
        />
        {isShort ? (
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            aria-label="Type"
          >
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        ) : (
          <select
            value={form.slot}
            onChange={(e) => setForm({ ...form, slot: e.target.value })}
            aria-label="Slot"
          >
            {SLOTS.map((t) => <option key={t}>{t}</option>)}
          </select>
        )}
        <button type="submit">Add</button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                {isShort ? (
                  <>
                    <th>Project</th>
                    <th>Type</th>
                    <th>Working title</th>
                    <th>Opening visual</th>
                  </>
                ) : (
                  <>
                    <th>Video</th>
                    <th>Slot</th>
                    <th>Notes</th>
                  </>
                )}
                <th>Target release</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v, i) => (
                <tr key={v.id}>
                  <td>{i + 1}</td>
                  <td><Link to={`/videos/${v.id}`}>{v.project}</Link></td>
                  {isShort ? (
                    <>
                      <td>{v.type}</td>
                      <td><Placeholder value={v.working_title} text="(to write)" /></td>
                      <td><Placeholder value={v.opening_visual} text="(to plan)" /></td>
                    </>
                  ) : (
                    <>
                      <td>{v.slot}</td>
                      <td>{v.notes}</td>
                    </>
                  )}
                  <td><Placeholder value={v.target_release_date} text="—" /></td>
                  <td>
                    <select
                      value={v.status}
                      onChange={(e) => setStatus(v.id, e.target.value)}
                      aria-label={`Status for ${v.project}`}
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button type="button" onClick={() => remove(v)} aria-label={`Delete ${v.project}`}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && <p className="muted">No videos yet.</p>}
        </div>
      )}
    </main>
  )
}

export default VideoList
