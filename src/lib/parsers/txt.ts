export async function parseTxt(file: File): Promise<string> {
  return (await file.text()).trim()
}
