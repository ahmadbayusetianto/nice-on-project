const MARKERS = {
  bold: '**',
  italic: '*',
  underline: '_',
  strikethrough: '~~',
}

function isWrappedAt(text, start, end, marker) {
  const len = marker.length
  return text.slice(start - len, start) === marker && text.slice(end, end + len) === marker
}

export function toggleMarker(text, start, end, type) {
  const marker = MARKERS[type]
  const len = marker.length
  const selected = text.slice(start, end)

  if (selected.length >= len * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(len, selected.length - len)
    return { text: text.slice(0, start) + inner + text.slice(end), start, end: start + inner.length }
  }

  if (isWrappedAt(text, start, end, marker)) {
    return {
      text: text.slice(0, start - len) + selected + text.slice(end + len),
      start: start - len,
      end: end - len,
    }
  }

  return {
    text: text.slice(0, start) + marker + selected + marker + text.slice(end),
    start: start + len,
    end: start + len + selected.length,
  }
}

export function clearFormatting(text, start, end) {
  const hasSelection = start !== end
  const target = hasSelection ? text.slice(start, end) : text
  const stripped = target
    .replaceAll(/\*\*(.+?)\*\*/g, '$1')
    .replaceAll(/~~(.+?)~~/g, '$1')
    .replaceAll(/_(.+?)_/g, '$1')
    .replaceAll(/\*(.+?)\*/g, '$1')

  if (!hasSelection) {
    return { text: stripped, start: stripped.length, end: stripped.length }
  }
  return { text: text.slice(0, start) + stripped + text.slice(end), start, end: start + stripped.length }
}

export function applyFormat(textareaEl, value, onChange, type) {
  if (!textareaEl) return
  const { selectionStart, selectionEnd } = textareaEl
  const result = type === 'clear'
    ? clearFormatting(value, selectionStart, selectionEnd)
    : toggleMarker(value, selectionStart, selectionEnd, type)

  onChange(result.text)
  requestAnimationFrame(() => {
    textareaEl.focus()
    textareaEl.setSelectionRange(result.start, result.end)
  })
}
