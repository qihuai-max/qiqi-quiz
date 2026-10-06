import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCollections, deleteCollection, updateCollectionCategory } from '../services/db'
import type { Collection, Category } from '../types'
import { CATEGORIES } from '../types'

const CAT_COLOR: Record<Category, string> = {
  运营: 'bg-blue-100 text-blue-700',
  文常: 'bg-purple-100 text-purple-700',
  英语: 'bg-amber-100 text-amber-700',
  其他: 'bg-slate-100 text-slate-600'
}

export default function CollectionsPage() {
  const [items, setItems] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function load() {
    const cols = await listCollections()
    setItems(cols)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('确定删除该题库及其所有题目？')) return
    await deleteCollection(id)
    load()
  }

  async function handleCategory(id: string, cat: Category) {
    await updateCollectionCategory(id, cat)
    load()
  }

  if (loading) return <div className="p-8 text-center text-slate-400">加载中…</div>

  const groups = CATEGORIES.map((cat) => ({ cat, list: items.filter((i) => i.category === cat) }))
  const others = items.filter((i) => i.category === '其他')
  if (others.length) groups.push({ cat: '其他' as Category, list: others })

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-lg font-bold">我的题库</h1>
        <button onClick={() => navigate('/upload')} className="bg-brand text-white px-4 py-2 rounded-lg text-sm">
          + 上传出题
        </button>
      </header>

      {items.length === 0 ? (
        <button
          onClick={() => navigate('/upload')}
          className="w-full bg-white rounded-xl shadow p-10 text-center text-slate-400"
        >
          暂无题库，点此上传文档自动生成题目
        </button>
      ) : (
        groups.map(({ cat, list }) =>
          list.length === 0 ? null : (
            <section key={cat} className="mb-6">
              <h2 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${CAT_COLOR[cat]}`}>{cat}</span>
                <span className="text-slate-400">{list.length}</span>
              </h2>
              <ul className="space-y-3">
                {list.map((c) => (
                  <li key={c.id} className="bg-white rounded-xl shadow p-4">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 min-w-0"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/generate/' + c.id)}
                      >
                        <div className="font-medium truncate">{c.title}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {c.question_count} 题 · {c.source_name ?? c.source_type} ·{' '}
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-3 ml-3 shrink-0">
                        <button onClick={() => navigate('/manage/' + c.id)} className="text-sm text-slate-500">
                          管理
                        </button>
                        <button onClick={() => navigate('/quiz/' + c.id)} className="text-sm text-brand">
                          答题
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-sm text-slate-400 hover:text-red-500">
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-400">改分类</span>
                      <select
                        value={c.category}
                        onChange={(e) => handleCategory(c.id, e.target.value as Category)}
                        className="text-xs border rounded-lg px-2 py-1 bg-white outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {CATEGORIES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                        <option value="其他">其他</option>
                      </select>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        )
      )}
    </div>
  )
}
