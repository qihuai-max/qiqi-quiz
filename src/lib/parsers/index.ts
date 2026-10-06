import type { SourceType } from '../../types'
import { parseTxt } from './txt'
import { parseMarkdown } from './markdown'
import { parseDocx } from './docx'
import { parsePdf } from './pdf'

export async function parseFile(
  file: File
): Promise<{ text: string; sourceType: SourceType }> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.txt')) return { text: await parseTxt(file), sourceType: 'txt' }
  if (name.endsWith('.md') || name.endsWith('.markdown'))
    return { text: await parseMarkdown(file), sourceType: 'md' }
  if (name.endsWith('.docx')) return { text: await parseDocx(file), sourceType: 'docx' }
  if (name.endsWith('.pdf')) return { text: await parsePdf(file), sourceType: 'pdf' }
  throw new Error('不支持的文件格式：' + file.name + '（仅支持 txt/md/docx/pdf）')
}
