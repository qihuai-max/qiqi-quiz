import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getCollectionRawText,
  getCollection,
  listQuestions,
  insertQuestions,
  updateCollectionCount
} from '../services/db'
import { generateFromChunk } from '../services/ai'
import { chunkText } from '../lib/chunk'
import Spinner from '../components/common/Spinner'
import type { QuestionContent, QuestionType, Category } from '../types'

const CAT_COLOR: Record<Category, string> = {
  运营: 'bg-blue-100 text-blue-700',
  文常: 'bg-purple-100 text-purple-700',
  英语: 'bg-amber-100 text-amber-700',
  其他: 'bg-slate-100 text-slate-600'
}

export default function GeneratePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [existing, setExisting] = useState<number | null>(null)
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [generated, setGenerated] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<Category | null>(null)

  useEffect(() => {
    listQuestions(id)
      .then((qs) => setExisting(qs.length))
      .catch(() => setExisting(0))
    getCollection(id)
      .then((c) => setCategory(c?.category ?? null))
      .catch(() => setCategory(null))
  }, [id])

  async function startGenerate() {
    setStatus('generating')
    setError(null)
    setGenerated(0)
    try {
      const raw = await getCollectionRawText(id)
      if (!raw || !raw.trim()) throw new Error('未找到文档原文，请重新上传。')
      const chunks = chunkText(raw, { size: 1400, overlap: 200 })
      if (chunks.length === 0) throw new Error('文档内容为空。')
      setProgress({ done: 0, total: chunks.length })

      const all: QuestionContent[] = []
      for (const ch of chunks) {
        const res = await generateFromChunk({ chunkText: ch.text, count: 3, c: 1, f: 1, e: 1 })
        if (res.questions?.length) {
          all.push(...res.questions)
          setGenerated(all.length)
        }
        setProgress((p) => ({ ...p, done: p.done + 1 }))
      }
      if (all.length === 0) throw new Error('出题结果为空，请检查设置页的 API Key 是否正确，或稍后重试。')

      const rows = all.map((q, idx) => ({
        collection_id: id,
        type: q.type as QuestionType,
        content: q,
        order_idx: idx
      }))
      await insertQuestions(rows)
      await updateCollectionCount(id, rows.length)
      setExisting(rows.length)
      setStatus('done')
    } catch (err) {
      setError((err as Error).message)
      setStatus('error')
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold py-4 flex items-center gap-2">
        出题
        {category && (
          <span className={`px-2 py-0.5 rounded-full text-xs ${CAT_COLOR[category]}`}>{category}</span>
        )}
      </h1>

      {existing !== null && existing > 0 && status === 'idle' && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <p>
            该题库已有 <b>{existing}</b> 道题。
          </p>
          <div className="flex gap-2">
            <button onClick={() => navigate('/quiz/' + id)} className="bg-brand text-white px-4 py-2 rounded-lg text-sm">
              去答题
            </button>
            <button onClick={startGenerate} className="px-4 py-2 rounded-lg text-sm border">
              重新出题
            </button>
          </div>
        </div>
      )}

      {existing !== null && existing === 0 && status === 'idle' && (
        <button onClick={startGenerate} className="w-full bg-brand text-white rounded-lg py-3">
          开始出题
        </button>
      )}

      {status === 'generating' && (
        <div className="bg-white rounded-xl shadow p-4">
          <Spinner label={`出题中… 已处理 ${progress.done}/${progress.total} 块，已生成 ${generated} 题`} />
        </div>
      )}

      {status === 'done' && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <p className="text-slate-600">出题完成，共 {existing} 题！</p>
          <button onClick={() => navigate('/quiz/' + id)} className="bg-brand text-white px-4 py-2 rounded-lg text-sm">
            去答题
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  )
}
