import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseFile } from '../lib/parsers'
import { createCollection } from '../services/db'
import { detectCategory } from '../services/ai'
import type { SourceType, Category } from '../types'

const MANUAL_OPTIONS: Category[] = ['运营', '文常', '英语', '其他']
type CategoryMode = 'auto' | Category

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [sourceType, setSourceType] = useState<SourceType | null>(null)
  const [preview, setPreview] = useState('')
  const [title, setTitle] = useState('')
  const [categoryMode, setCategoryMode] = useState<CategoryMode>('auto')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setError(null)
    try {
      const { text: t, sourceType: st } = await parseFile(f)
      if (!t.trim()) {
        setError('未能从文件中提取到文本。若是扫描版 PDF（图片），暂不支持，请先用 OCR 转文本。')
        return
      }
      setFile(f)
      setText(t)
      setSourceType(st)
      setPreview(t.slice(0, 800))
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleSubmit() {
    if (!file || !sourceType) return
    setBusy(true)
    setError(null)
    try {
      let cat: Category = categoryMode === 'auto' ? '其他' : categoryMode
      if (categoryMode === 'auto') {
        cat = await detectCategory(text)
      }
      const col = await createCollection({
        title: title || file.name,
        source_type: sourceType,
        source_name: file.name,
        raw_text: text,
        category: cat
      })
      navigate('/generate/' + col.id)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm border ${
      active ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200'
    }`

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold py-4">上传出题</h1>
      <input
        type="file"
        accept=".txt,.md,.markdown,.docx,.pdf"
        onChange={handleFile}
        className="block w-full text-sm text-slate-600"
      />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {file && (
        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="题库名称"
            className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand"
          />

          <div>
            <label className="text-xs text-slate-500">归类到题库</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <button type="button" onClick={() => setCategoryMode('auto')} className={chipClass(categoryMode === 'auto')}>
                自动识别
              </button>
              {MANUAL_OPTIONS.map((c) => (
                <button key={c} type="button" onClick={() => setCategoryMode(c)} className={chipClass(categoryMode === c)}>
                  {c}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {categoryMode === 'auto'
                ? '「自动识别」会调用 AI 判断材料属于运营/文常/英语哪类并归入对应题库；未填 Key 时默认归入「其他」。'
                : `将归入「${categoryMode}」题库。`}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-3 max-h-48 overflow-auto text-xs text-slate-600 whitespace-pre-wrap">
            {preview}
          </div>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full bg-brand text-white rounded-lg py-2 disabled:opacity-60"
          >
            {busy ? '创建中…' : '创建题库并出题'}
          </button>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-4">
        支持 TXT / Markdown / Word(.docx) / 文本型 PDF。扫描版（图片）PDF 暂不支持，请先用 OCR 转文本。
      </p>
    </div>
  )
}
