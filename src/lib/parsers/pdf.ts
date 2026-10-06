import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// 仅支持「文本型 PDF」。扫描版（图片）无文字层会返回空，上传时需提示用户。
export async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const strings = (content.items as Array<{ str?: string }>)
      .map((it) => it.str ?? '')
      .join(' ')
    text += strings + '\n'
  }
  return text.trim()
}
