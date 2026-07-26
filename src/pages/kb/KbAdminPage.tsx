import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { sanitizeHtml } from '../../lib/sanitizeHtml'
import { btnPrimary, btnSecondary, inputCls, labelCls } from '../../lib/ui'
import type { KbArticle, KbBodyFormat } from '../../lib/types'

const blank = {
  title: '',
  category: 'General',
  summary: '',
  body: '',
  body_format: 'text' as KbBodyFormat,
  published: true,
}

export default function KbAdminPage() {
  const [articles, setArticles] = useState<KbArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<(typeof blank & { id?: string }) | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('kb_articles').select('*').order('updated_at', { ascending: false })
    setArticles((data as KbArticle[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    if (!editing || !editing.title.trim()) return
    const { id, ...f } = editing
    if (id) await supabase.from('kb_articles').update({ ...f, updated_at: new Date().toISOString() }).eq('id', id)
    else await supabase.from('kb_articles').insert(f)
    setEditing(null)
    await load()
  }
  async function remove(a: KbArticle) {
    if (!window.confirm(`Delete "${a.title}"?`)) return
    await supabase.from('kb_articles').delete().eq('id', a.id)
    await load()
  }

  return (
    <div className="text-[13px]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-[#4b4a44]">Write simple how-to guides customers can read themselves in the portal.</p>
        <button className={btnPrimary} onClick={() => setEditing({ ...blank })}>New guide…</button>
      </div>

      <div className="bevel-in overflow-x-auto">
        <table className="tbl95 w-full min-w-[640px]">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Format</th><th>Visible?</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="!p-6 text-center text-[#8a867a]">Loading…</td></tr>
            ) : articles.length === 0 ? (
              <tr><td colSpan={5} className="!p-6 text-center text-[#8a867a]">No guides yet.</td></tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id} className="bg-white">
                  <td className="font-bold">{a.title}</td>
                  <td>{a.category}</td>
                  <td className="text-[#4b4a44]">{a.body_format === 'html' ? 'HTML' : 'Plain text'}</td>
                  <td>{a.published ? <span className="text-green-700">Published</span> : <span className="text-[#8a867a]">Draft</span>}</td>
                  <td className="whitespace-nowrap text-right">
                    <button className="link95 mr-2" onClick={() => setEditing({ ...a })}>Edit</button>
                    <button className="link95 text-red-600" onClick={() => remove(a)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="win-frame my-8 w-full max-w-2xl">
            <div className="titlebar flex items-center justify-between px-2 py-1.5">
              <span className="text-[13px] font-bold text-white">{editing.id ? 'Edit guide' : 'New guide'}</span>
              <button className="btn95 flex h-[22px] w-[24px] items-center justify-center !p-0 font-bold" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block"><span className={labelCls}>Title *</span><input className={inputCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
                <label className="block"><span className={labelCls}>Category</span><input className={inputCls} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></label>
              </div>
              <label className="block"><span className={labelCls}>Short summary</span><input className={inputCls} value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} placeholder="One line shown in the list" /></label>

              <div>
                <span className={labelCls}>How is the guide written?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`btn95 ${editing.body_format === 'text' ? 'pressed' : ''}`}
                    onClick={() => setEditing({ ...editing, body_format: 'text' })}
                  >
                    Plain text
                  </button>
                  <button
                    type="button"
                    className={`btn95 ${editing.body_format === 'html' ? 'pressed' : ''}`}
                    onClick={() => setEditing({ ...editing, body_format: 'html' })}
                  >
                    HTML
                  </button>
                </div>
                <p className="mt-1 text-[12px] text-[#4b4a44]">
                  {editing.body_format === 'text'
                    ? 'Each line becomes its own paragraph. Nothing else to think about.'
                    : 'Paste HTML and it will be displayed formatted (headings, lists, links, images…).'}
                </p>
              </div>

              <label className="block">
                <span className={labelCls}>
                  {editing.body_format === 'html' ? 'Guide (HTML)' : 'Guide (plain text — one step per line)'}
                </span>
                <textarea
                  className={`${inputCls} ${editing.body_format === 'html' ? 'font-mono !text-[12px]' : ''}`}
                  rows={10}
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  placeholder={
                    editing.body_format === 'html'
                      ? '<h2>Restart your router</h2>\n<ol><li>Unplug it</li><li>Wait 30 seconds</li></ol>'
                      : 'Unplug the router\nWait 30 seconds\nPlug it back in'
                  }
                />
              </label>

              {editing.body_format === 'html' && editing.body.trim() && (
                <div>
                  <span className={labelCls}>Preview (as the customer will see it)</span>
                  <div
                    className="bevel-in kb-html max-h-64 overflow-y-auto p-3"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(editing.body) }}
                  />
                </div>
              )}

              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> <span>Visible to customers</span></label>
            </div>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <button className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
              <button className={btnPrimary} onClick={save} disabled={!editing.title.trim()}>Save guide</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
