import { useEffect, useState } from 'react'
import { listRecords, countAllQuestions } from '../services/db'

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 text-center">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState({ totalQ: 0, totalA: 0, correct: 0 })
  const [week, setWeek] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const qCount = await countAllQuestions()
      const recs = await listRecords()
      const correct = recs.filter((r) => r.correct === true).length
      const days = new Array(7).fill(0)
      const now = Date.now()
      for (const r of recs) {
        const d = Math.floor((now - new Date(r.created_at).getTime()) / 86400000)
        if (d >= 0 && d < 7) days[6 - d]++
      }
      setStats({ totalQ: qCount, totalA: recs.length, correct })
      setWeek(days)
      setLoading(false)
    })()
  }, [])

  const rate = stats.totalA ? Math.round((stats.correct / stats.totalA) * 100) : 0
  const max = Math.max(1, ...week)

  if (loading) return <div className="p-8 text-center text-slate-400">加载中…</div>

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold py-4">统计</h1>
      <div className="grid grid-cols-3 gap-3">
        <Card label="题库题目" value={stats.totalQ} />
        <Card label="答题次数" value={stats.totalA} />
        <Card label="总正确率" value={rate + '%'} />
      </div>
      <div className="bg-white rounded-xl shadow p-4 mt-4">
        <div className="text-sm text-slate-500 mb-2">近 7 天答题量</div>
        <div className="flex items-end gap-2 h-32">
          {week.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end">
              <div
                className="w-full bg-brand rounded"
                style={{ height: `${(v / max) * 100}%`, minHeight: v ? 4 : 0 }}
              />
              <div className="text-[10px] text-slate-400 mt-1">
                {['一', '二', '三', '四', '五', '六', '日'][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
