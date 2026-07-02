type SearchValue = string | number | boolean | null | undefined

export function searchMatches(query: string, values: SearchValue[]) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return values.some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery))
}
