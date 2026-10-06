import { useEffect, useState } from 'react'
import { listRecords, getQuestion } from '../services/db'
import type { Question, AnswerRecord } from '../types'

function typeLabel(t: string) {
  return t === 'choice' ? '选择题' : t === 'fill' ? '填空题' : '简答题'
}

export default function WrongBookPage() {
  const [items, setItems] = useState<Array<{ q: Question }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const recs = (await listRecords()).filter((r: AnswerRecord) => r.correct === false)
      const seen = new Set<string>()
      const pairs: Array<{ q: Question }> = []
      for (const r of recs) {
        if (seen.has(r.question_id)) continue
        seen.add(r.question_id)
        const q = await getQuestion(r.question_id)
        if (q) pairs.push({ q })
      }
      setItems(pairs)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-400">加载中…</div>

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold py-4">错题本</h1>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-slate-400">还没有错题，继续加油！</div>
      ) : (
        <ul className="space-y-3">
          {items.map(({ q }) => (
            <li key={q.id} className="bg-white rounded-xl shadow p-4">
              <div className="text-xs text-slate-400">{typeLabel(q.type)}</div>
              <div className="font-medium mt-1">{q.content.stem}</div>
              <div className="text-sm mt-2 text-slate-500">答案：{q.content.answer}</div>
              <div className="text-sm mt-1 text-slate-400">解析：{q.content.explanation}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
