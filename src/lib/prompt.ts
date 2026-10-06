import type { Category } from '../types'

export interface GeneratedQuestion {
  type: 'choice' | 'fill' | 'essay'
  stem: string
  options: string[] | null
  answer: string
  explanation: string
}

export function buildSystemPrompt(): string {
  return `你是一位严谨的出题老师。根据给定「学习材料片段」生成测验题。
要求：
1. 题型按比例包含选择题、填空题、简答题。
2. 题目必须基于材料原文事实，不得编造材料中没有的内容。
3. 只输出一个 JSON 数组，不要任何解释文字、不要 markdown 代码块围栏。
4. 每个元素结构如下（注意是严格 JSON）：
{
  "type": "choice" | "fill" | "essay",
  "stem": "题干",
  "options": ["A. ...","B. ...","C. ...","D. ..."] 或 null,
  "answer": "选择题填正确选项字母(如 B)；填空题填标准答案；简答题填参考答案要点",
  "explanation": "解析"
}
5. 选择题 options 必须有 4 个且材料中可推出唯一正确答案；填空题 answer 简短；简答题 answer 给出 2-4 个得分要点。`
}

export function buildUserPrompt(
  chunkText: string,
  count: number,
  c: number,
  f: number,
  e: number
): string {
  return `材料片段：
"""
${chunkText}
"""
请基于以上片段生成 ${count} 道题（选择题 ${c} 道、填空题 ${f} 道、简答题 ${e} 道），仅返回 JSON 数组。`
}

/** 容错解析模型输出：剥离 ``` 围栏、模糊提取数组、逐条校验字段。 */
export function parseQuestions(raw: string): GeneratedQuestion[] {
  let s = (raw || '').trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  const arrMatch = s.match(/\[[\s\S]*\]/)
  if (arrMatch) s = arrMatch[0]
  let data: unknown
  try {
    data = JSON.parse(s)
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []

  const out: GeneratedQuestion[] = []
  for (const item of data as Record<string, unknown>[]) {
    if (!item || typeof item !== 'object') continue
    const type = item.type
    if (type !== 'choice' && type !== 'fill' && type !== 'essay') continue
    if (typeof item.stem !== 'string' || !item.stem.trim()) continue
    if (typeof item.answer !== 'string' || !item.answer.trim()) continue
    if (typeof item.explanation !== 'string') continue
    if (type === 'choice') {
      if (!Array.isArray(item.options) || item.options.length !== 4) continue
    }
    out.push({
      type,
      stem: item.stem,
      options: type === 'choice' ? (item.options as string[]) : null,
      answer: item.answer,
      explanation: item.explanation
    })
  }
  return out
}

// ---- 题库分类识别 ----

export function buildCategorySystemPrompt(): string {
  return `你是题库分类器。判断给定「学习材料」最贴合以下哪个题库分类，仅回复一个词（不要解释、不要多余字符）：
运营、文常、英语、其他。
分类标准：
- 运营：与运营工作相关，如活动策划、用户增长、产品运营、推广投放、数据复盘、社群/内容运营等。
- 文常：文化常识与百科知识，如历史、文学、地理、生活常识、通识百科等。
- 英语：语言学习类，如英语语法、词汇、口语、翻译、考试英语等。
- 其他：均不明显的综合性或个性化材料。`
}

export function buildCategoryUserPrompt(text: string): string {
  return `材料片段：
"""
${text.slice(0, 1500)}
"""
请回复最匹配的分类词（运营/文常/英语/其他 之一）。`
}

export function parseCategory(raw: string): Category {
  const s = (raw || '').trim()
  if (s.includes('运营')) return '运营'
  if (s.includes('文常')) return '文常'
  if (s.includes('英语')) return '英语'
  return '其他'
}
