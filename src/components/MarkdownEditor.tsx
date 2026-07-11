import { useEffect, useMemo, useRef } from 'react'
import {
  BoldItalicUnderlineToggles,
  ListsToggle,
  MDXEditor,
  type MDXEditorMethods,
  markdownShortcutPlugin,
  listsPlugin,
  Separator,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import './MarkdownEditor.css'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const editorRef = useRef<MDXEditorMethods | null>(null)

  const plugins = useMemo(() => ([
    listsPlugin(),
    markdownShortcutPlugin(),
    toolbarPlugin({
      toolbarClassName: 'md-editor-toolbar',
      toolbarContents: () => (
        <>
          <UndoRedo />
          <Separator />
          <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
          <Separator />
          <ListsToggle options={['bullet', 'number']} />
        </>
      ),
    }),
  ]), [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const currentValue = editor.getMarkdown()
    if (currentValue !== value) {
      editor.setMarkdown(value)
    }
  }, [value])

  return (
    <div className="md-editor-shell">
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={(nextValue) => onChange(nextValue)}
        placeholder={placeholder || '使用 Markdown 编写...'}
        plugins={plugins}
        spellCheck={false}
        className="md-editor-root"
        contentEditableClassName="md-editor-content"
      />
    </div>
  )
}
