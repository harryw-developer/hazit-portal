// Strips anything executable from staff-authored HTML before it is shown to
// customers: scripts/embeds, inline event handlers and javascript: URLs.
// Ordinary formatting, links, images, lists and tables all pass through.

const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'style', 'base', 'form']

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''

  root.querySelectorAll(BLOCKED_TAGS.join(',')).forEach((el) => el.remove())

  root.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value.replace(/\s+/g, '').toLowerCase()
      // Inline handlers (onclick, onerror, …) and script-y URLs
      if (name.startsWith('on') || value.startsWith('javascript:') || value.startsWith('data:text/html')) {
        el.removeAttribute(attr.name)
      }
    }
    // Links open safely in a new tab
    if (el.tagName === 'A') {
      el.setAttribute('target', '_blank')
      el.setAttribute('rel', 'noopener noreferrer')
    }
  })

  return root.innerHTML
}
