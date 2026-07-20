export function sanitizeFaqHtml(input = '') {
  if (typeof window === 'undefined') return String(input ?? '')

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${String(input ?? '')}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''

  const blockedTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'])

  const walk = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node
      const tagName = element.tagName.toLowerCase()

      if (blockedTags.has(tagName)) {
        element.remove()
        return
      }

      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase()
        if (name.startsWith('on') || name === 'style') {
          element.removeAttribute(attribute.name)
        }

        if (tagName !== 'a' && (name === 'href' || name === 'target' || name === 'rel')) {
          element.removeAttribute(attribute.name)
        }
      })

      if (tagName === 'a') {
        const href = element.getAttribute('href') || '#'
        if (!/^https?:\/\//i.test(href) && !href.startsWith('#') && !href.startsWith('/')) {
          element.setAttribute('href', '#')
        }
        element.setAttribute('rel', 'noreferrer noopener')
        if (!element.getAttribute('target')) {
          element.setAttribute('target', '_blank')
        }
      }
    }

    Array.from(node.childNodes).forEach((child) => walk(child))
  }

  walk(root)
  return root.innerHTML
}

export function stripFaqHtml(input = '') {
  return String(input ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
