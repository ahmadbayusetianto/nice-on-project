const PATTERN = /\*\*(.+?)\*\*|~~(.+?)~~|_(.+?)_|\*(.+?)\*/g

export default function RichText({ text }) {
  if (!text) return null

  const nodes = []
  let lastIndex = 0
  let key = 0

  for (const match of text.matchAll(PATTERN)) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) nodes.push(<strong key={key++}>{match[1]}</strong>)
    else if (match[2] !== undefined) nodes.push(<s key={key++}>{match[2]}</s>)
    else if (match[3] !== undefined) nodes.push(<u key={key++}>{match[3]}</u>)
    else nodes.push(<em key={key++}>{match[4]}</em>)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))

  return nodes
}
