const SPREADSHEET_EXT = /\.(xls|xlsx)$/i

/** Reads a statement file as CSV text; Excel exports are converted via a lazily loaded SheetJS. */
export async function readStatementFile(file: File): Promise<string> {
  if (!SPREADSHEET_EXT.test(file.name)) return file.text()

  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_csv(sheet, { FS: ',', rawNumbers: false })
}
