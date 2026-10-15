import { useEffect, useRef } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const BUTTONS = [
  { label: 'Bold', text: 'B', mark: 'bold', run: (c) => c.toggleBold() },
  { label: 'Italic', text: 'I', mark: 'italic', run: (c) => c.toggleItalic() },
  { label: 'Underline', text: 'U', mark: 'underline', run: (c) => c.toggleUnderline() },
  { label: 'Heading', text: 'H2', mark: ['heading', { level: 2 }], run: (c) => c.toggleHeading({ level: 2 }) },
  { label: 'Bullet list', text: '• List', mark: 'bulletList', run: (c) => c.toggleBulletList() },
  { label: 'Numbered list', text: '1. List', mark: 'orderedList', run: (c) => c.toggleOrderedList() },
  { label: 'Quote', text: '“ ”', mark: 'blockquote', run: (c) => c.toggleBlockquote() },
]

// Rich text editor that saves its HTML after a pause in typing and when it loses focus.
const SAVE_DELAY_MS = 1500

function ScriptEditor({ initialHtml, onSave, labelledBy }) {
  const onSaveRef = useRef(onSave)
  useEffect(() => {
    onSaveRef.current = onSave
  })

  const timer = useRef(null)
  const editorRef = useRef(null)

  const flush = () => {
    if (timer.current === null) return
    clearTimeout(timer.current)
    timer.current = null
    const e = editorRef.current
    if (e) onSaveRef.current(e.isEmpty ? '' : e.getHTML())
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml || '',
    editorProps: {
      attributes: { class: 'script-body', role: 'textbox', 'aria-multiline': 'true', 'aria-labelledby': labelledBy },
    },
    onUpdate: () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, SAVE_DELAY_MS)
    },
    onBlur: flush,
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  // Save any pending edit when leaving the page.
  useEffect(() => flush, [])

  // Re-render toolbar when the selection or marks change.
  const active = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor ? BUTTONS.map((b) => editor.isActive(...[].concat(b.mark))) : [],
  })

  if (!editor) return null

  // Keep focus in the editor when clicking toolbar buttons.
  const keepFocus = (e) => e.preventDefault()

  return (
    <div className="script-editor">
      <div className="toolbar" role="toolbar" aria-label="Script formatting">
        {BUTTONS.map((b, i) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            aria-pressed={active[i]}
            onMouseDown={keepFocus}
            onClick={() => b.run(editor.chain().focus()).run()}
          >
            {b.text}
          </button>
        ))}
        <button type="button" aria-label="Undo" onMouseDown={keepFocus} onClick={() => editor.chain().focus().undo().run()}>Undo</button>
        <button type="button" aria-label="Redo" onMouseDown={keepFocus} onClick={() => editor.chain().focus().redo().run()}>Redo</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default ScriptEditor
