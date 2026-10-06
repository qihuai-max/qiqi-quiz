import { get, set } from 'idb-keyval'
import type { Question } from '../types'

// 离线缓存：把已下载的题目写入本地 IndexedDB，断网时可继续查看刷题。
const key = (collectionId: string) => 'questions:' + collectionId

export async function cacheQuestions(collectionId: string, qs: Question[]): Promise<void> {
  await set(key(collectionId), qs)
}

export async function getCachedQuestions(collectionId: string): Promise<Question[] | null> {
  const v = await get<Question[]>(key(collectionId))
  return v ?? null
}
