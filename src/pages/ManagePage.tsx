import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  listQuestions,
  getCollection,
  insertQuestions,
  deleteQuestion,
  updateCollectionCount
} from '../services/db'
import type { Question, QuestionType, Category, QuestionContent } from '../types'

const TYPE_LABEL: Record<QuestionType, string> = { choice: '选择题', fill: '填空题', essay: '简答题' }
const TYPE_COLOR: Record<QuestionType, string> = {
  choice: 'bg-blue-100 text-blue-700',
  fill: 'bg-purple-100 text-purple-700',
  essay: 'bg-amber-100 text-amber-700'
}
const CAT_COLOR: Record<Category, string> = {
  运营: 'bg-blue-100 text-blue-700',
  文常: 'bg-purple-100 text-purple-700',
  英语: 'bg-amber-100 text-amber-700',
  其他: 'bg-slate-100 text-slate-600'
}

export default function ManagePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)

  // 录入表单
  const [type, setType] = useState<QuestionType>('choice')
  const [stem, setStem] = useState('')
  const [optA, setOptA] = useState('')
  const [optB, setOptB] = useState('')
  const [optC, setOptC] = useState('')
  const [optD, setOptD] = useState('')
  const [choiceAnswer, setChoiceAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [fillAnswer, setFillAnswer] = useState('')
  const [essayAnswer, setEssayAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  async function load() {
    const [col, qs] = await Promise.all([getCollection(id), listQuestions(id)])
    setTitle(col?.title ?? '题库')
    setCategory(col?.category ?? null)
    setQuestions(qs)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [id])

  async function handleDelete(qid: string) {
    if (!confirm('确定删除这道题？')) return
    await deleteQuestion(qid)
    const qs = await listQuestions(id)
    setQuestions(qs)
    await updateCollectionCount(id, qs.length)
  }

  function resetForm() {
    setType('choice')
    setStem('')
    setOptA('')
    setOptB('')
    setOptC('')
    setOptD('')
    setChoiceAnswer('A')
    setFillAnswer('')
    setEssayAnswer('')
    setExplanation('')
    setFormError(null)
  }

  async function handleAdd() {
    setFormError(null)
    let content: QuestionContent
    if (type === 'choice') {
      if (!stem.trim()) return setFormError('请填写题干。')
      const opts = [optA, optB, optC, optD].map((o) => o.trim())
      if (opts.some((o) => !o)) return setFormError('请填齐 4 个选项。')
      if (!['A', 'B', 'C', 'D'].includes(choiceAnswer)) return setFormError('请选择正确答案。')
      content = { type: 'choice', stem: stem.trim(), options: opts, answer: choiceAnswer, explanation: explanation.trim() }
    } else if (type === 'fill') {
      if (!stem.trim()) return setFormError('请填写题干。')
      if (!fillAnswer.trim()) return setFormError('请填写标准答案。')
      content = { type: 'fill', stem: stem.trim(), options: null, answer: fillAnswer.trim(), explanation: explanation.trim() }
    } else {
      if (!stem.trim()) return setFormError('请填写题干。')
      if (!essayAnswer.trim()) return setFormError('请填写参考答案。')
      content = { type: 'essay', stem: stem.trim(), options: null, answer: essayAnswer.trim(), explanation: explanation.trim() }
    }
    setBusy(true)
    try {
      await insertQuestions([{ collection_id: id, type, content, order_idx: Date.now() }])
      await load()
      setShowForm(false)
      resetForm()
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">加载中…</div>

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">{title}</h1>
          {category && (
            <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs ${CAT_COLOR[category]}`}>{category}</span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => navigate('/generate/' + id)} className="text-sm text-slate-500">
            AI出题
          </button>
          <button onClick={() => navigate('/quiz/' + id)} className="text-sm text-brand">
            答题
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">共 {questions.length} 题</span>
        <button
          onClick={() => {
            resetForm()
            setShowForm((v) => !v)
          }}
          className="bg-brand text-white px-3 py-1.5 rounded-lg text-sm"
        >
          {showForm ? '收起' : '+ 录入题目'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3 mb-4">
          <div className="flex gap-2">
            {(['choice', 'fill', 'essay'] as QuestionType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  type === t ? 'bg-brand text-white border-brand' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          <textarea
            value={stem}
            onChange={(e) => setStem(e.target.value)}
            placeholder="题干"
            className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand h-20"
          />

          {type === 'choice' && (
            <div className="space-y-2">
              {(
                [
                  ['A', optA, setOptA],
                  ['B', optB, setOptB],
                  ['C', optC, setOptC],
                  ['D', optD, setOptD]
                ] as Array<[string, string, (v: string) => void]>
              ).map(([letter, val, setter], i) => (
                <div key={letter} className="flex items-center gap-2">
                  <span className="w-5 text-slate-400">{letter}</span>
                  <input
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={`选项 ${letter}`}
                    className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setChoiceAnswer((['A', 'B', 'C', 'D'] as const)[i])}
                    className={`px-2 py-1 rounded text-xs border ${
                      choiceAnswer === (['A', 'B', 'C', 'D'] as const)[i]
                        ? 'bg-brand text-white border-brand'
                        : 'text-slate-500 border-slate-200'
                    }`}
                  >
                    正确
                  </button>
                </div>
              ))}
              <p className="text-xs text-slate-400">点「正确」标记该题答案（高亮项即正确答案）。</p>
            </div>
          )}

          {type === 'fill' && (
            <input
              value={fillAnswer}
              onChange={(e) => setFillAnswer(e.target.value)}
              placeholder="标准答案"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand"
            />
          )}

          {type === 'essay' && (
            <textarea
              value={essayAnswer}
              onChange={(e) => setEssayAnswer(e.target.value)}
              placeholder="参考答案要点"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand h-24"
            />
          )}

          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="解析（可选）"
            className="w-full border rounded-lg px-3 py-2 outline-none focus:border-brand h-16"
          />

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button onClick={handleAdd} disabled={busy} className="w-full bg-brand text-white rounded-lg py-2 disabled:opacity-60">
            {busy ? '保存中…' : '保存题目'}
          </button>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-slate-400">
          该题库还没有题目。点「录入题目」手动添加，或去「AI出题」。
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((q, i) => (
            <li key={q.id} className="bg-white rounded-xl shadow p-4 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400">{i + 1}.</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLOR[q.type]}`}>{TYPE_LABEL[q.type]}</span>
                </div>
                <div className="text-sm truncate">{q.content.stem}</div>
              </div>
              <button onClick={() => handleDelete(q.id)} className="text-sm text-slate-400 hover:text-red-500 ml-3 shrink-0">
                删除
              </button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => navigate('/')} className="mt-6 text-sm text-slate-400">
        ← 返回题库列表
      </button>
    </div>
  )
}
