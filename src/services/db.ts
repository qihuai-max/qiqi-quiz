import { get, set } from 'idb-keyval'
import type {
  Collection,
  Question,
  AnswerRecord,
  QuestionType,
  QuestionContent,
  AISettings,
  BackupData,
  Category
} from '../types'

const K_COL = 'qq_collections'
const K_Q = 'qq_questions'
const K_R = 'qq_records'
const K_AI = 'qq_ai_settings'

async function read<T>(key: string): Promise<T[]> {
  const v = await get<T[]>(key)
  return v ?? []
}
async function write<T>(key: string, arr: T[]): Promise<void> {
  await set(key, arr)
}
function uid(): string {
  return crypto.randomUUID()
}

// ---- Collections ----
export async function listCollections(): Promise<Collection[]> {
  const all = await read<Collection>(K_COL)
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getCollection(id: string): Promise<Collection | null> {
  const all = await read<Collection>(K_COL)
  return all.find((c) => c.id === id) ?? null
}

export async function createCollection(input: {
  title: string
  source_type: Collection['source_type']
  source_name?: string
  raw_text?: string
  category?: Category
}): Promise<Collection> {
  const col: Collection = {
    id: uid(),
    title: input.title,
    source_type: input.source_type,
    source_name: input.source_name ?? null,
    raw_text: input.raw_text ?? '',
    question_count: 0,
    category: input.category ?? '其他',
    created_at: new Date().toISOString()
  }
  const all = await read<Collection>(K_COL)
  all.push(col)
  await write(K_COL, all)
  return col
}

export async function updateCollectionCategory(id: string, category: Category): Promise<void> {
  const all = await read<Collection>(K_COL)
  const c = all.find((x) => x.id === id)
  if (c) {
    c.category = category
    await write(K_COL, all)
  }
}

export async function getCollectionRawText(id: string): Promise<string | null> {
  const c = await getCollection(id)
  return c?.raw_text ?? null
}

export async function deleteCollection(id: string): Promise<void> {
  const cols = (await read<Collection>(K_COL)).filter((c) => c.id !== id)
  await write(K_COL, cols)
  const qs = (await read<Question>(K_Q)).filter((q) => q.collection_id !== id)
  await write(K_Q, qs)
}

// ---- Questions ----
export async function listQuestions(collectionId: string): Promise<Question[]> {
  const all = await read<Question>(K_Q)
  return all
    .filter((q) => q.collection_id === collectionId)
    .sort((a, b) => a.order_idx - b.order_idx)
}

export async function getQuestion(id: string): Promise<Question | null> {
  const all = await read<Question>(K_Q)
  return all.find((q) => q.id === id) ?? null
}

export async function insertQuestions(
  rows: Array<{ collection_id: string; type: QuestionType; content: QuestionContent; order_idx: number }>
): Promise<Question[]> {
  const all = await read<Question>(K_Q)
  const created: Question[] = rows.map((r) => ({
    id: uid(),
    collection_id: r.collection_id,
    type: r.type,
    content: r.content,
    order_idx: r.order_idx,
    created_at: new Date().toISOString()
  }))
  all.push(...created)
  await write(K_Q, all)
  return created
}

export async function deleteQuestion(id: string): Promise<void> {
  const all = (await read<Question>(K_Q)).filter((q) => q.id !== id)
  await write(K_Q, all)
}

export async function updateCollectionCount(id: string, count: number): Promise<void> {
  const all = await read<Collection>(K_COL)
  const c = all.find((x) => x.id === id)
  if (c) {
    c.question_count = count
    await write(K_COL, all)
  }
}

export async function countAllQuestions(): Promise<number> {
  const all = await read<Question>(K_Q)
  return all.length
}

// ---- Records ----
export async function listRecords(collectionId?: string): Promise<AnswerRecord[]> {
  const all = await read<AnswerRecord>(K_R)
  const filtered = collectionId ? all.filter((r) => r.collection_id === collectionId) : all
  return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function insertRecord(row: {
  question_id: string
  collection_id: string
  selected?: string | null
  correct?: boolean | null
  self_score?: number | null
}): Promise<AnswerRecord> {
  const rec: AnswerRecord = {
    id: uid(),
    question_id: row.question_id,
    collection_id: row.collection_id,
    selected: row.selected ?? null,
    correct: row.correct ?? null,
    self_score: row.self_score ?? null,
    created_at: new Date().toISOString()
  }
  const all = await read<AnswerRecord>(K_R)
  all.push(rec)
  await write(K_R, all)
  return rec
}

// ---- AI settings（本机 localStorage 明文，纯本地方案） ----
export async function getProfile(): Promise<AISettings | null> {
  const raw = localStorage.getItem(K_AI)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AISettings
  } catch {
    return null
  }
}

export async function saveProfile(input: AISettings): Promise<void> {
  localStorage.setItem(K_AI, JSON.stringify(input))
}

// ---- Backup / restore / clear ----
export async function exportAll(): Promise<BackupData> {
  const [collections, questions, records] = await Promise.all([
    read<Collection>(K_COL),
    read<Question>(K_Q),
    read<AnswerRecord>(K_R)
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    collections,
    questions,
    records
  }
}

export async function importAll(data: BackupData): Promise<void> {
  if (!data?.collections || !data?.questions || !data?.records) {
    throw new Error('备份文件格式不正确。')
  }
  await write(K_COL, data.collections)
  await write(K_Q, data.questions)
  await write(K_R, data.records)
}

export async function clearAll(): Promise<void> {
  await Promise.all([write(K_COL, []), write(K_Q, []), write(K_R, [])])
}
