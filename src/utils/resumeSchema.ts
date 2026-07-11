import {
  DEFAULT_MODULE_TITLES,
  type BuiltInResumeModuleType,
  type CustomResumeModule,
  type EducationItem,
  type ResumeData,
  type ResumeModule,
  type WorkItem,
} from '../data/resumeData'

const BUILT_IN_MODULE_TYPES: BuiltInResumeModuleType[] = [
  'basicInfo',
  'education',
  'workExperience',
  'projectExperience',
  'clubExperience',
  'personalSummary',
]

const SCHEMA_VERSION = 1
const SCHEMA_TYPE = 'cv-preview-resume'

export interface ResumeSchemaFile {
  type: typeof SCHEMA_TYPE
  schemaVersion: typeof SCHEMA_VERSION
  exportedAt: string
  data: ResumeData
}

export function createResumeSchemaFile(data: ResumeData): ResumeSchemaFile {
  return {
    type: SCHEMA_TYPE,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function parseResumeSchemaJson(jsonText: string): ResumeData {
  let parsed: unknown

  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('JSON 解析失败，请检查文件格式。')
  }

  const payload = isRecord(parsed) && isRecord(parsed.data)
    ? parsed.data
    : parsed

  if (!isRecord(payload)) {
    throw new Error('JSON 顶层结构不正确，无法识别简历数据。')
  }

  return normalizeResumeData(payload)
}

function normalizeResumeData(source: Record<string, unknown>): ResumeData {
  const basicInfoSource = isRecord(source.basicInfo) ? source.basicInfo : {}
  const educationSource = Array.isArray(source.education) ? source.education : []
  const workExperienceSource = Array.isArray(source.workExperience) ? source.workExperience : []
  const projectExperienceSource = Array.isArray(source.projectExperience) ? source.projectExperience : []
  const clubExperienceSource = Array.isArray(source.clubExperience) ? source.clubExperience : []

  const normalized: ResumeData = {
    modules: [],
    basicInfo: {
      name: asString(basicInfoSource.name),
      phone: asString(basicInfoSource.phone),
      email: asString(basicInfoSource.email),
      age: asString(basicInfoSource.age),
      gender: asString(basicInfoSource.gender),
      maritalStatus: asString(basicInfoSource.maritalStatus),
      currentStatus: asString(basicInfoSource.currentStatus),
      targetCity: asString(basicInfoSource.targetCity),
    },
    education: educationSource.map(item => normalizeEducationItem(item)),
    workExperience: workExperienceSource.map(item => normalizeWorkItem(item)),
    projectExperience: projectExperienceSource.map(item => normalizeWorkItem(item)),
    clubExperience: clubExperienceSource.map(item => normalizeWorkItem(item)),
    personalSummary: asString(source.personalSummary),
  }

  normalized.modules = normalizeModules(source, normalized)

  return normalized
}

function normalizeModules(source: Record<string, unknown>, data: ResumeData) {
  const modulesSource = Array.isArray(source.modules) ? source.modules : []
  const normalizedModules: ResumeModule[] = []
  const seenBuiltIns = new Set<BuiltInResumeModuleType>()
  const seenIds = new Set<string>()

  for (const item of modulesSource) {
    if (!isRecord(item) || typeof item.type !== 'string') {
      continue
    }

    if (isBuiltInModuleType(item.type)) {
      if (seenBuiltIns.has(item.type)) {
        continue
      }

      seenBuiltIns.add(item.type)
      normalizedModules.push({
        id: item.type,
        type: item.type,
        title: asNonEmptyString(item.title, DEFAULT_MODULE_TITLES[item.type]),
      })
      seenIds.add(item.type)
      continue
    }

    if (item.type !== 'custom') {
      continue
    }

    const customId = createUniqueId(
      asNonEmptyString(item.id, `custom-${Date.now()}-${normalizedModules.length}`),
      seenIds,
    )
    const customModule: CustomResumeModule = {
      id: customId,
      type: 'custom',
      title: asNonEmptyString(item.title, '自定义模块'),
      content: asString(item.content),
    }

    normalizedModules.push(customModule)
    seenIds.add(customId)
  }

  if (!seenBuiltIns.has('basicInfo')) {
    normalizedModules.unshift({
      id: 'basicInfo',
      type: 'basicInfo',
      title: DEFAULT_MODULE_TITLES.basicInfo,
    })
  }

  if (normalizedModules.length === 1 && normalizedModules[0].type === 'basicInfo') {
    const fallbackModules = deriveModulesFromData(source, data)
    return ensureBasicInfoFirst(fallbackModules)
  }

  return ensureBasicInfoFirst(normalizedModules)
}

function deriveModulesFromData(source: Record<string, unknown>, data: ResumeData) {
  const derivedModules: ResumeModule[] = [
    {
      id: 'basicInfo',
      type: 'basicInfo',
      title: DEFAULT_MODULE_TITLES.basicInfo,
    },
  ]

  if (Array.isArray(source.education) || data.education.length > 0) {
    derivedModules.push({
      id: 'education',
      type: 'education',
      title: DEFAULT_MODULE_TITLES.education,
    })
  }

  if (Array.isArray(source.workExperience) || data.workExperience.length > 0) {
    derivedModules.push({
      id: 'workExperience',
      type: 'workExperience',
      title: DEFAULT_MODULE_TITLES.workExperience,
    })
  }

  if (Array.isArray(source.projectExperience) || data.projectExperience.length > 0) {
    derivedModules.push({
      id: 'projectExperience',
      type: 'projectExperience',
      title: DEFAULT_MODULE_TITLES.projectExperience,
    })
  }

  if (Array.isArray(source.clubExperience) || data.clubExperience.length > 0) {
    derivedModules.push({
      id: 'clubExperience',
      type: 'clubExperience',
      title: DEFAULT_MODULE_TITLES.clubExperience,
    })
  }

  if ('personalSummary' in source || data.personalSummary.trim()) {
    derivedModules.push({
      id: 'personalSummary',
      type: 'personalSummary',
      title: DEFAULT_MODULE_TITLES.personalSummary,
    })
  }

  return derivedModules
}

function ensureBasicInfoFirst(modules: ResumeModule[]) {
  const basicInfoModule = modules.find(module => module.type === 'basicInfo') ?? {
    id: 'basicInfo',
    type: 'basicInfo' as const,
    title: DEFAULT_MODULE_TITLES.basicInfo,
  }

  const others = modules.filter(module => module.type !== 'basicInfo')
  return [basicInfoModule, ...others]
}

function normalizeEducationItem(item: unknown): EducationItem {
  const source = isRecord(item) ? item : {}

  return {
    school: asString(source.school),
    major: asString(source.major),
    degree: asString(source.degree),
    department: asString(source.department),
    studyType: asString(source.studyType, '全日制'),
    startDate: asString(source.startDate),
    endDate: asString(source.endDate),
    city: asString(source.city),
    description: asString(source.description),
  }
}

function normalizeWorkItem(item: unknown): WorkItem {
  const source = isRecord(item) ? item : {}
  const isCurrent = asBoolean(source.isCurrent)

  return {
    company: asString(source.company),
    position: asString(source.position),
    department: asString(source.department),
    startDate: asString(source.startDate),
    endDate: isCurrent ? '' : asString(source.endDate),
    isCurrent,
    city: asString(source.city),
    description: asString(source.description),
  }
}

function isBuiltInModuleType(value: string): value is BuiltInResumeModuleType {
  return BUILT_IN_MODULE_TYPES.includes(value as BuiltInResumeModuleType)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNonEmptyString(value: unknown, fallback: string) {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : fallback
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function createUniqueId(baseId: string, seenIds: Set<string>) {
  if (!seenIds.has(baseId)) {
    return baseId
  }

  let index = 2
  let nextId = `${baseId}-${index}`

  while (seenIds.has(nextId)) {
    index += 1
    nextId = `${baseId}-${index}`
  }

  return nextId
}
