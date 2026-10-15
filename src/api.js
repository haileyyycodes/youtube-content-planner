export const STATUSES = ['idea', 'scripted', 'filmed', 'edited', 'published']
export const TYPES = ['Alter', 'From scratch', 'Alter + dye']
export const SLOTS = ['Up next', 'Later']
export const FORMATS = [
  { id: 'short', label: 'Shorts' },
  { id: 'long', label: 'Long form' },
]

export async function api(path, options) {
  const res = await fetch(`/api/videos${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText)
  return res.status === 204 ? null : res.json()
}
