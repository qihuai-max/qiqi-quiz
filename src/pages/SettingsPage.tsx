import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { getProfile, saveProfile, exportAll, importAll, clearAll } from '../services/db'
import type { AISettings, BackupData } from '../types'

export default function SettingsPage() {
  const [provider, setProvider] = useState<'deepseek' | 'openai'>('deepseek')
  const [key, setKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setProvider(p.provider)
        setKey(p.apiKey)
        setBaseUrl(p.baseUrl || '')
      }
    })
  }, [])

  async function save() {
    setErr(null)
    setMsg(null)
    try {
      await saveProfile({ provider, apiKey: key, baseUrl: baseUrl.trim() } as AISettings)
      setMsg('已保存。Key 仅存于本机浏览器，由网页直连大模型接口（部署到公网后请留意不要公开分享网址）。')
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  async function exportData() {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `七槐刷题备份_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('已导出备份文件，可保存到电脑或发到手机导入。')
  }

  async function importData(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const text = await f.text()
      const data = JSON.parse(text) as BackupData
      await importAll(data)
      setMsg('导入成功，题库与进度已恢复。')
    } catch (er) {
      setErr('导入失败：' + (er as Error).message)
    }
    e.target.value = ''
  }

  async function clearData() {
    if (!confirm('确定清空所有题库、题目与答题记录？此操作不可恢复！')) return
    await clearAll()
    setMsg('已清空全部数据。')
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold py-4">设置</h1>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="text-sm font-medium text-slate-600">AI 出题配置</div>
        <div>
          <label className="text-sm text-slate-500">AI 服务商</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'deepseek' | 'openai')}
            className="w-full border rounded-lg px-3 py-2 mt-1 outline-none focus:border-brand"
          >
            <option value="deepseek">DeepSeek（推荐，便宜）</option>
            <option value="openai">OpenAI 兼容</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-500">API Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="粘贴你的 API Key"
            className="w-full border rounded-lg px-3 py-2 mt-1 outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="text-sm text-slate-500">接口地址（可选）</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="留空用官方地址，如 https://api.deepseek.com/v1"
            className="w-full border rounded-lg px-3 py-2 mt-1 outline-none focus:border-brand"
          />
          <p className="text-xs text-slate-400 mt-1">
            默认直连官方接口；若部署后出题报跨域错误，可在此填一个支持跨域的代理地址。
          </p>
        </div>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button onClick={save} className="bg-brand text-white px-4 py-2 rounded-lg text-sm">
          保存
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mt-4 space-y-3">
        <div className="text-sm font-medium text-slate-600">数据（本地存储）</div>
        <p className="text-xs text-slate-400">
          数据存在本机浏览器。换设备/清缓存会丢，请用「导出备份」保存，再到另一台设备「导入」。
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportData} className="border px-4 py-2 rounded-lg text-sm">
            导出备份
          </button>
          <label className="border px-4 py-2 rounded-lg text-sm cursor-pointer">
            导入备份
            <input type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
          <button
            onClick={clearData}
            className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-lg"
          >
            清空全部
          </button>
        </div>
      </div>
    </div>
  )
}
