export interface TextChunk {
  index: number
  text: string
}

interface ChunkOptions {
  size?: number
  overlap?: number
}

/**
 * 将长文本切块，避免单次大模型请求超 token 上限。
 * 优先在段落边界（\n\n）或句边界（。）切分，块间保留 overlap 重叠。
 */
export function chunkText(text: string, opts: ChunkOptions = {}): TextChunk[] {
  const size = opts.size ?? 1400
  const overlap = opts.overlap ?? 200
  const chunks: TextChunk[] = []
  const clean = text.trim()
  if (!clean) return chunks

  let start = 0
  let i = 0
  while (start < clean.length) {
    let end = start + size
    if (end >= clean.length) {
      end = clean.length
    } else {
      const window = clean.slice(start, end)
      const p = window.lastIndexOf('\n\n')
      const s = window.lastIndexOf('。')
      const cut = p > size * 0.5 ? p : s > size * 0.5 ? s : size
      end = start + cut
    }
    const piece = clean.slice(start, end).trim()
    if (piece) chunks.push({ index: i++, text: piece })
    if (end >= clean.length) break
    start = Math.max(end - overlap, start + 1)
  }
  return chunks
}
