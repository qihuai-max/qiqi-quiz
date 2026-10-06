export type QuestionType = 'choice' | 'fill' | 'essay'
export type SourceType = 'txt' | 'md' | 'docx' | 'pdf'

/** 题库分类：三大类 + 兜底「其他」 */
export type Category = '运营' | '文常' | '英语' | '其他'
/** 用于首页分组的固定三大类（顺序即展示顺序） */
export const CATEGORIES: Category[] = ['运营', '文常', '英语']

export interface QuestionContent {
  type: QuestionType
  stem: string
  options: string[] | null
  answer: string
  explanation: string
}

export interface Collection {
  id: string
  title: string
  source_type: SourceType
  source_name: string | null
  raw_text: string
  question_count: number
  category: Category
  created_at: string
}

export interface Question {
  id: string
  collection_id: string
  type: QuestionType
  content: QuestionContent
  order_idx: number
  created_at: string
}

export interface AnswerRecord {
  id: string
  question_id: string
  collection_id: string
  selected: string | null
  correct: boolean | null
  self_score: number | null
  created_at: string
}

export interface AISettings {
  provider: 'deepseek' | 'openai'
  apiKey: string
  /** 可选：自定义接口 Base URL（通常含 /v1）。留空则使用官方地址。 */
  baseUrl?: string
}

export interface BackupData {
  version: number
  exportedAt: string
  collections: Collection[]
  questions: Question[]
  records: AnswerRecord[]
}
