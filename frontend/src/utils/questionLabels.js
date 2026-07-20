export function formatQuestionGroupLabel(group) {
  switch (Number(group)) {
    case 1:
      return 'TWK'
    case 2:
      return 'TIU'
    case 3:
      return 'TKP'
    default:
      return 'Unknown'
  }
}

export function formatQuestionTypeLabel(type) {
  const normalized = String(type || 'SKD').toUpperCase()
  if (normalized === 'SINGLE' || normalized === 'SKD') return 'SKD'
  if (normalized === 'SKB') return 'SKB'
  return normalized || '-'
}
