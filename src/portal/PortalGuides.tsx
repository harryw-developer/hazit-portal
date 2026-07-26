import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitizeHtml } from '../lib/sanitizeHtml'
import type { KbArticle } from '../lib/types'
import { BackBar, EmptyState, PageHeading, PortalCard } from './ui'

export default function PortalGuides() {
  const [articles, setArticles] = useState<KbArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<KbArticle | null>(null)

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('published', true)
        .order('category')
      setArticles((data as KbArticle[]) || [])
      setLoading(false)
    })()
  }, [])

  if (open) {
    return (
      <div>
        <button
          onClick={() => setOpen(null)}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-lg font-semibold text-slate-700 hover:border-blue-400"
        >
          ← Back to guides
        </button>
        <PortalCard>
          <div className="text-sm font-semibold uppercase tracking-wide text-blue-500">{open.category}</div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{open.title}</h1>
          {open.body_format === 'html' ? (
            <div
              className="kb-html mt-5 text-xl leading-relaxed text-slate-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(open.body) }}
            />
          ) : (
            <div className="mt-5 space-y-3 text-xl leading-relaxed text-slate-700">
              {open.body.split('\n').filter(Boolean).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </PortalCard>
      </div>
    )
  }

  return (
    <div>
      <BackBar />
      <PageHeading emoji="📖">Help Guides</PageHeading>
      <p className="mb-6 text-lg text-slate-600">Simple step-by-step guides you can follow yourself.</p>

      {loading ? (
        <p className="text-xl text-slate-500">Loading…</p>
      ) : articles.length === 0 ? (
        <EmptyState emoji="📖" title="No guides yet" hint="We'll add helpful how-tos here soon." />
      ) : (
        <div className="space-y-4">
          {articles.map((a) => (
            <button key={a.id} onClick={() => setOpen(a)} className="block w-full text-left">
              <PortalCard className="hover:border-blue-400">
                <div className="text-sm font-semibold uppercase tracking-wide text-blue-500">{a.category}</div>
                <div className="mt-1 text-xl font-bold text-slate-900">{a.title}</div>
                {a.summary && <div className="mt-1 text-lg text-slate-500">{a.summary}</div>}
              </PortalCard>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
