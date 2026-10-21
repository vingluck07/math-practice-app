/** Stored characters as a friendly size. Only a rough guide, so no exact bytes. */
export function formatUsage(characters: number): string {
  if (characters < 1000) return 'under 1 KB'
  return `${Math.round(characters / 1000).toLocaleString('en-US')} KB`
}
