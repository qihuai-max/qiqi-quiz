import type { GeneratedQuestion } from '../lib/prompt'
import type { Category } from '../types'
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseQuestions,
  buildCategorySystemPrompt,
  buildCategoryUserPrompt,
  parseCategory
} from '../lib/prompt'

export interface GeneratePayload {
  chunkText: string
  count: number
  c: number
  f: number
  e: number
}

/**
 * 纯本地 / 静态部署方案：前端直接调用大模型官方接口（Key 存于本机浏览器）。
 * 这样部署到 Netlify 等静态托管时无需服务端、无需函数，拖放即可上线。
 */
const DEFAULT_BASE: Record<'deepseek' | 'openai', string> = {
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1'
}

const MODEL: Record<'deepseek' | 'openai', string> = {
  deepseek: 'deepseek-chat',
  openai: 'gpt-4o-mini'
}

interface ResolvedSettings {
  provider: 'deepseek' | 'openai'
  apiKey: string
  baseUrl: string
}

function getSettings(): ResolvedSettings | null {
  try {
    const raw = localStorage.getItem('qq_ai_settings')
    if (!raw) return null
    const s = JSON.parse(raw) as { provider: 'deepseek' | 'openai'; apiKey: string; baseUrl?: string }
    if (!s?.apiKey) return null
    return {
      provider: s.provider,
      apiKey: s.apiKey,
      baseUrl: (s.baseUrl && s.baseUrl.trim()) || DEFAULT_BASE[s.provider]
    }
  } catch {
    return null
  }
}

export async function generateFromChunk(
  payload: GeneratePayload
): Promise<{ questions: GeneratedQuestion[] }> {
  const settings = getSettings()
  if (!settings) {
    throw new Error('请先在「设置」页填写 API Key。')
  }
  const res = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: MODEL[settings.provider],
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        {
          role: 'user',
          content: buildUserPrompt(payload.chunkText, payload.count, payload.c, payload.f, payload.e)
        }
      ],
      temperature: 0.7
    })
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`出题请求失败（${res.status}）：${t.slice(0, 200)}`)
  }
  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ''
  const questions = parseQuestions(content)
  return { questions }
}

/**
 * 自动识别材料所属题库分类（运营/文常/英语/其他）。
 * 未配置 API Key 或调用失败时兜底返回 '其他'，不抛错，保证上传流程顺畅。
 */
export async function detectCategory(text: string): Promise<Category> {
  const settings = getSettings()
  if (!settings) return '其他'
  try {
    const res = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: MODEL[settings.provider],
        messages: [
          { role: 'system', content: buildCategorySystemPrompt() },
          { role: 'user', content: buildCategoryUserPrompt(text) }
        ],
        temperature: 0,
        max_tokens: 8
      })
    })
    if (!res.ok) return '其他'
    const data = await res.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ''
    return parseCategory(content)
  } catch {
    return '其他'
  }
}
