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
const RESUME_DATA_START_MARKER = '<!-- cv-preview:resume-data:start -->'
const RESUME_DATA_END_MARKER = '<!-- cv-preview:resume-data:end -->'

const RESUME_DATA_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://cv-preview.local/schema/resume-data.schema.json',
  title: 'CV Preview ResumeData',
  type: 'object',
  required: [
    'modules',
    'basicInfo',
    'education',
    'workExperience',
    'projectExperience',
    'clubExperience',
    'personalSummary',
  ],
  properties: {
    modules: {
      type: 'array',
      description: '模块顺序。basicInfo 必须存在且只能有一个。',
      items: {
        oneOf: [
          {
            type: 'object',
            required: ['id', 'type', 'title'],
            properties: {
              id: { type: 'string' },
              type: {
                enum: ['basicInfo', 'education', 'workExperience', 'projectExperience', 'clubExperience', 'personalSummary'],
              },
              title: { type: 'string' },
            },
            additionalProperties: false,
          },
          {
            type: 'object',
            required: ['id', 'type', 'title', 'content'],
            properties: {
              id: { type: 'string' },
              type: { const: 'custom' },
              title: { type: 'string' },
              content: { type: 'string' },
            },
            additionalProperties: false,
          },
        ],
      },
    },
    basicInfo: {
      type: 'object',
      required: ['name', 'phone', 'email', 'age', 'gender', 'maritalStatus', 'currentStatus', 'targetCity'],
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        age: { type: 'string' },
        gender: { type: 'string' },
        maritalStatus: { type: 'string' },
        currentStatus: { type: 'string' },
        targetCity: { type: 'string' },
      },
      additionalProperties: false,
    },
    education: { type: 'array', items: { $ref: '#/$defs/educationItem' } },
    workExperience: { type: 'array', items: { $ref: '#/$defs/experienceItem' } },
    projectExperience: { type: 'array', items: { $ref: '#/$defs/experienceItem' } },
    clubExperience: { type: 'array', items: { $ref: '#/$defs/experienceItem' } },
    personalSummary: { type: 'string' },
  },
  $defs: {
    educationItem: {
      type: 'object',
      required: ['school', 'major', 'degree', 'department', 'studyType', 'startDate', 'endDate', 'city', 'description'],
      properties: {
        school: { type: 'string' },
        major: { type: 'string' },
        degree: { type: 'string' },
        department: { type: 'string' },
        studyType: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        city: { type: 'string' },
        description: { type: 'string' },
      },
      additionalProperties: false,
    },
    experienceItem: {
      type: 'object',
      required: ['company', 'position', 'department', 'startDate', 'endDate', 'isCurrent', 'city', 'description'],
      properties: {
        company: { type: 'string' },
        position: { type: 'string' },
        department: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        isCurrent: { type: 'boolean' },
        city: { type: 'string' },
        description: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
} as const

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

export function createResumeSkillMarkdown(data: ResumeData): string {
  const schemaJson = JSON.stringify(RESUME_DATA_JSON_SCHEMA, null, 2)
  const dataJson = JSON.stringify(data, null, 2)

  return [
    '---',
    'name: cv-preview-resume-editor',
    'description: 根据 JSON Schema 修改并维护可渲染的简历数据。',
    '---',
    '',
    '# 简历编辑 Skill',
    '',
    '这是一份可被 Codex、Claude 或其它 AI 工具编辑的简历 Skill。请遵循以下规则：',
    '',
    '1. 只修改“当前简历数据”区块中的 JSON，不要删除数据区块标记。',
    '2. 保持 JSON 符合下方 JSON Schema；需要新增模块时，请同步更新 modules 和对应数据字段。',
    '3. 经历描述、个人总结和自定义模块的 content 使用 Markdown 字符串。',
    '4. 时间字段使用“YYYY年MM月”，当前经历的 endDate 为空字符串且 isCurrent 为 true。',
    '5. 返回完整 Markdown 文件，网页会提取当前简历数据区块进行渲染。',
    '',
    '## 数据结构定义',
    '',
    '- `modules`: 模块顺序和模块标题。basicInfo 固定且只能有一个。',
    '- `basicInfo`: 姓名、联系方式和个人信息。',
    '- `education`: 教育经历数组。',
    '- `workExperience`: 工作经历数组。',
    '- `projectExperience`: 项目经历数组。',
    '- `clubExperience`: 社团和组织经历数组。',
    '- `personalSummary`: 个人总结 Markdown 字符串。',
    '- `custom` 模块: 使用 `content` 保存自定义 Markdown 内容。',
    '',
    '## JSON Schema',
    '',
    '```json',
    schemaJson,
    '```',
    '',
    '## 当前简历数据',
    '',
    RESUME_DATA_START_MARKER,
    '```json',
    dataJson,
    '```',
    RESUME_DATA_END_MARKER,
    '',
  ].join('\n')
}

export function parseResumeSkillMarkdown(markdown: string): ResumeData {
  const trimmed = markdown.trim()

  // Keep previously exported JSON files importable during the format transition.
  if (trimmed.startsWith('{')) {
    return parseResumeSchemaJson(trimmed)
  }

  const markerPattern =
    escapeRegExp(RESUME_DATA_START_MARKER) + '\\s*```(?:json)?\\s*([\\s\\S]*?)```\\s*' + escapeRegExp(RESUME_DATA_END_MARKER)
  const markedSection = markdown.match(new RegExp(markerPattern, 'i'))
  const dataSection = markedSection?.[1] ?? extractResumeDataCodeBlock(markdown)

  if (!dataSection) {
    throw new Error('Markdown 中未找到“当前简历数据”JSON 区块。请保留 Skill 模板中的数据标记。')
  }

  return parseResumeSchemaJson(dataSection.trim())
}

function extractResumeDataCodeBlock(markdown: string) {
  const headingMatch = markdown.match(/(?:^|\n)#{1,3}\s*(?:当前简历数据|简历数据|ResumeData)\s*\n/i)
  if (!headingMatch || headingMatch.index === undefined) {
    return null
  }

  const section = markdown.slice(headingMatch.index + headingMatch[0].length)
  const codeMatch = section.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return codeMatch?.[1] ?? null
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
