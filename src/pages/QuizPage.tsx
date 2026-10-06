import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { listQuestions, insertRecord } from '../services/db'
import { cacheQuestions, getCachedQuestions } from '../hooks/useLocalCache'
import type { Question } from '../types'

interface AnswerState {
  selected: string | null
  submitted: boolean
  selfScore: number | null
}

function typeLabel(t: string) {
  return t === 'choice' ? '选择题' : t === 'fill' ? '填空题' : '简答题'
}

export default function QuizPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [state, setState] = useState<AnswerState>({ selected: null, submitted: false, selfScore: null })
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const qs = await listQuestions(id)
        setQuestions(qs)
        await cacheQuestions(id, qs)
      } catch {
        const cached = await getCachedQuestions(id)
        if (cached) setQuestions(cached)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const q = questions[idx]
  const isChoice = q?.type === 'choice'
  const isFill = q?.type === 'fill'
  const isEssay = q?.type === 'essay'

  function checkCorrect(): boolean | null {
    if (!q) return null
    if (isChoice) return state.selected === q.content.answer
    if (isFill) return (state.selected ?? '').trim() === q.content.answer.trim()
    return null
  }

  async function submit() {
    if (!q) return
    if (!isEssay && state.selected === null) return
    const correct = checkCorrect()
    if (isChoice || isFill) {
      await insertRecord({ question_id: q.id, collection_id: id, selected: state.selected, correct: correct ?? false })
    } else {
      await insertRecord({
        question_id: q.id,
        collection_id: id,
        selected: state.selected,
        correct: null,
        self_score: state.selfScore
      })
    }
    if (correct) setScore((s) => s + 1)
    setState((s) => ({ ...s, submitted: true }))
  }

  function next() {
    if (idx + 1 >= questions.length) {
      setFinished(true)
      return
    }
    setIdx(idx + 1)
    setState({ selected: null, submitted: false, selfScore: null })
  }

  if (loading) return <div className="p-8 text-center text-slate-400">加载中…</div>
  if (!q)
    return (
      <div className="p-8 text-center text-slate-400">
        该题库还没有题目。
        <button onClick={() => navigate('/generate/' + id)} className="text-brand block mt-2">
          去出题
        </button>
      </div>
    )

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between py-4 text-sm text-slate-500">
        <span>
          第 {idx + 1} / {questions.length} 题
        </span>
        <span>客观题答对 {score}</span>
      </div>

      <div className="bg-white rounded-xl shadow p-4 space-y-4">
        <span className="text-xs inline-block bg-slate-100 rounded px-2 py-0.5">{typeLabel(q.type)}</span>
        <div className="font-medium">{q.content.stem}</div>

        {isChoice && q.content.options && (
          <div className="space-y-2">
            {q.content.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const chosen = state.selected === letter
              let cls = 'border p-3 rounded-lg cursor-pointer'
              if (state.submitted) {
                if (letter === q.content.answer) cls = 'border border-green-500 bg-green-50 p-3 rounded-lg'
                else if (chosen) cls = 'border border-red-500 bg-red-50 p-3 rounded-lg'
                else cls = 'border p-3 rounded-lg opacity-60'
              } else if (chosen) cls = 'border border-blue-500 bg-blue-50 p-3 rounded-lg'
              return (
                <div
                  key={i}
                  className={cls}
                  onClick={() => !state.submitted && setState((s) => ({ ...s, selected: letter }))}
                >
                  {opt}
                </div>
              )
            })}
          </div>
        )}

        {isFill && (
          <input
            value={state.selected ?? ''}
            disabled={state.submitted}
            onChange={(e) => setState((s) => ({ ...s, selected: e.target.value }))}
            placeholder="输入你的答案"
            className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand"
          />
        )}

        {isEssay && (
          <div className="space-y-3">
            <textarea
              value={state.selected ?? ''}
              disabled={state.submitted}
              onChange={(e) => setState((s) => ({ ...s, selected: e.target.value }))}
              placeholder="写下你的回答…"
              className="w-full border rounded-lg px-3 py-2 h-28 outline-none focus:border-brand"
            />
            {state.submitted && (
              <div>
                <div className="text-sm text-slate-500 mb-1">参考答案：</div>
                <div className="text-sm bg-slate-50 p-2 rounded">{q.content.answer}</div>
                <div className="text-sm mt-3">自评（0-5）：</div>
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setState((s) => ({ ...s, selfScore: n }))}
                      className={`w-8 h-8 rounded ${state.selfScore === n ? 'bg-brand text-white' : 'border'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {state.submitted && (isChoice || isFill) && (
          <div className="text-sm">
            <span className={checkCorrect() ? 'text-green-600' : 'text-red-600'}>
              {checkCorrect() ? '✓ 正确' : '✗ 错误'}
            </span>
            <div className="mt-1 text-slate-500">解析：{q.content.explanation}</div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!state.submitted ? (
            <button
              onClick={submit}
              disabled={!isEssay && state.selected === null}
              className="bg-brand text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              提交
            </button>
          ) : (
            <button onClick={next} className="bg-brand text-white px-4 py-2 rounded-lg text-sm">
              {idx + 1 >= questions.length ? '完成' : '下一题'}
            </button>
          )}
        </div>
      </div>

      {finished && (
        <div className="bg-white rounded-xl shadow p-6 text-center mt-4">
          <div className="text-lg font-bold">本次完成！</div>
          <div className="text-slate-500 mt-1">客观题答对 {score} / {questions.length}</div>
          <button onClick={() => navigate('/')} className="mt-4 text-brand text-sm">
            返回题库
          </button>
        </div>
      )}
    </div>
  )
}
