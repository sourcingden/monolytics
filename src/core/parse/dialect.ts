// Autodetects the CSV dialect of a Monobank export. Real exports have shown up as
// comma-, semicolon-, and tab-separated depending on how the user obtained the file
// (direct export vs. copy-paste through a spreadsheet) — never assume comma.

const CANDIDATE_DELIMITERS = [',', ';', '\t'] as const

/** Picks the delimiter that splits the header line into the most fields. */
export function detectDelimiter(sampleText: string): string {
  const firstLine = sampleText.split(/\r\n|\n|\r/, 1)[0] ?? ''

  let best: { delimiter: string; count: number } = { delimiter: ',', count: 0 }
  for (const delimiter of CANDIDATE_DELIMITERS) {
    const count = firstLine.split(delimiter).length
    if (count > best.count) {
      best = { delimiter, count }
    }
  }
  return best.delimiter
}

/**
 * Decodes a file buffer to text. Monobank exports are UTF-8, but a file that has been
 * re-saved through Excel on a Ukrainian/Russian locale Windows install can end up as
 * windows-1251. We try UTF-8 first and fall back if it produced replacement characters.
 */
export function decodeStatementBuffer(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  if (!utf8.includes('�')) return utf8

  try {
    return new TextDecoder('windows-1251').decode(buffer)
  } catch {
    return utf8
  }
}
