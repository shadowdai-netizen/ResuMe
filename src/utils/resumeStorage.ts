import type { PreviewSettings } from '../components/ResumePreview'
import type { ResumeData } from '../data/resumeData'
import type { ResumePhoto } from '../data/resumePhoto'
import { RESUME_DATA_SCHEMA } from './resumeSchema'

const DATABASE_NAME = 'cv-preview'
const DATABASE_VERSION = 1
const STORE_NAME = 'resumes'

export interface StoredResume {
  id: string
  name: string
  data: ResumeData
  photo: ResumePhoto | null
  config: PreviewSettings
  schema: typeof RESUME_DATA_SCHEMA
  createdAt: number
  updatedAt: number
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('当前浏览器不支持 IndexedDB，无法保存简历。'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('无法打开简历存储。'))
  })
}

export async function listStoredResumes(): Promise<StoredResume[]> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () => {
      database.close()
      resolve((request.result as StoredResume[]).sort((left, right) => right.updatedAt - left.updatedAt))
    }
    request.onerror = () => {
      database.close()
      reject(request.error ?? new Error('无法读取简历列表。'))
    }
  })
}

export async function saveStoredResume(
  id: string,
  name: string,
  data: ResumeData,
  photo: ResumePhoto | null,
  config: PreviewSettings,
  timestamps?: Pick<StoredResume, 'createdAt' | 'updatedAt'>,
): Promise<StoredResume> {
  const database = await openDatabase()
  const now = Date.now()
  const record: StoredResume = {
    id,
    name,
    data,
    photo,
    config,
    schema: RESUME_DATA_SCHEMA,
    createdAt: timestamps?.createdAt ?? now,
    updatedAt: timestamps?.updatedAt ?? now,
  }

  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record)
    request.onsuccess = () => {
      database.close()
      resolve(record)
    }
    request.onerror = () => {
      database.close()
      reject(request.error ?? new Error('无法保存简历。'))
    }
  })
}

export async function deleteStoredResume(id: string): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id)
    request.onsuccess = () => {
      database.close()
      resolve()
    }
    request.onerror = () => {
      database.close()
      reject(request.error ?? new Error('无法删除简历。'))
    }
  })
}

export function createResumeId() {
  return `resume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
