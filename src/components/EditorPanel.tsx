import { memo, useMemo, type ReactNode } from 'react'
import { DEFAULT_MODULE_TITLES, type CustomResumeModule, type ResumeData, type ResumeModule, type WorkItem } from '../data/resumeData'
import MarkdownEditor from './MarkdownEditor'
import './EditorPanel.css'

interface EditorPanelProps {
  data: ResumeData
  onChange: (data: ResumeData) => void
  activeModuleId: string | null
  onModuleFocus: (id: string | null) => void
}

function EditorPanel({ data, onChange, activeModuleId, onModuleFocus }: EditorPanelProps) {
  const activeEducationIndex = useMemo(() => getIndexedPosition(activeModuleId, 'edu'), [activeModuleId])
  const activeWorkIndex = useMemo(() => getIndexedPosition(activeModuleId, 'work'), [activeModuleId])
  const activeProjectIndex = useMemo(() => getIndexedPosition(activeModuleId, 'project'), [activeModuleId])
  const activeClubIndex = useMemo(() => getIndexedPosition(activeModuleId, 'club'), [activeModuleId])
  const activeCustomModule = useMemo(
    () => data.modules.find(
      (module): module is CustomResumeModule => module.id === activeModuleId && module.type === 'custom',
    ) ?? null,
    [data.modules, activeModuleId],
  )

  const educationModule = data.modules.find(module => module.type === 'education') ?? null
  const workModule = data.modules.find(module => module.type === 'workExperience') ?? null
  const projectModule = data.modules.find(module => module.type === 'projectExperience') ?? null
  const clubModule = data.modules.find(module => module.type === 'clubExperience') ?? null
  const summaryModule = data.modules.find(module => module.type === 'personalSummary') ?? null
  const basicInfoModule = data.modules.find(module => module.type === 'basicInfo') ?? null

  const updateBasicInfo = (field: string, value: string) => {
    onChange({
      ...data,
      basicInfo: { ...data.basicInfo, [field]: value },
    })
  }

  const updateModuleTitle = (moduleId: string, title: string) => {
    onChange({
      ...data,
      modules: data.modules.map(module => (
        module.id === moduleId ? { ...module, title } : module
      )),
    })
  }

  const updateEducation = (index: number, field: string, value: string) => {
    const nextEducation = [...data.education]
    nextEducation[index] = { ...nextEducation[index], [field]: value }
    onChange({ ...data, education: nextEducation })
  }

  const addEducation = () => {
    const nextData = {
      ...data,
      education: [
        ...data.education,
        {
          school: '',
          major: '',
          degree: '',
          department: '',
          studyType: '全日制',
          startDate: '',
          endDate: '',
          city: '',
          description: '',
        },
      ],
    }
    onChange(nextData)
    onModuleFocus(`edu-${nextData.education.length - 1}`)
  }

  const removeEducation = (index: number) => {
    const nextEducation = data.education.filter((_, itemIndex) => itemIndex !== index)
    onChange({ ...data, education: nextEducation })
    if (nextEducation.length === 0) {
      onModuleFocus('education')
      return
    }

    const nextIndex = Math.min(index, nextEducation.length - 1)
    onModuleFocus(`edu-${nextIndex}`)
  }

  const updateWork = (index: number, field: string, value: string | boolean) => {
    const nextWorkExperience = [...data.workExperience]
    nextWorkExperience[index] = { ...nextWorkExperience[index], [field]: value }
    onChange({ ...data, workExperience: nextWorkExperience })
  }

  const addWork = () => {
    const nextData = {
      ...data,
      workExperience: [
        ...data.workExperience,
        {
          company: '',
          position: '',
          department: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          city: '',
          description: '',
        },
      ],
    }
    onChange(nextData)
    onModuleFocus(`work-${nextData.workExperience.length - 1}`)
  }

  const removeWork = (index: number) => {
    const nextWorkExperience = data.workExperience.filter((_, itemIndex) => itemIndex !== index)
    onChange({ ...data, workExperience: nextWorkExperience })
    if (nextWorkExperience.length === 0) {
      onModuleFocus('workExperience')
      return
    }

    const nextIndex = Math.min(index, nextWorkExperience.length - 1)
    onModuleFocus(`work-${nextIndex}`)
  }

  const updateProject = (index: number, field: keyof WorkItem, value: string | boolean) => {
    const nextProjects = [...data.projectExperience]
    nextProjects[index] = { ...nextProjects[index], [field]: value }
    onChange({ ...data, projectExperience: nextProjects })
  }

  const addProject = () => {
    const nextData = {
      ...data,
      projectExperience: [...data.projectExperience, createEmptyWorkItem()],
    }
    onChange(nextData)
    onModuleFocus(`project-${nextData.projectExperience.length - 1}`)
  }

  const removeProject = (index: number) => {
    const nextProjects = data.projectExperience.filter((_, itemIndex) => itemIndex !== index)
    onChange({ ...data, projectExperience: nextProjects })
    if (nextProjects.length === 0) {
      onModuleFocus('projectExperience')
      return
    }

    onModuleFocus(`project-${Math.min(index, nextProjects.length - 1)}`)
  }

  const updateClub = (index: number, field: keyof WorkItem, value: string | boolean) => {
    const nextClubs = [...data.clubExperience]
    nextClubs[index] = { ...nextClubs[index], [field]: value }
    onChange({ ...data, clubExperience: nextClubs })
  }

  const addClub = () => {
    const nextData = {
      ...data,
      clubExperience: [...data.clubExperience, createEmptyWorkItem()],
    }
    onChange(nextData)
    onModuleFocus(`club-${nextData.clubExperience.length - 1}`)
  }

  const removeClub = (index: number) => {
    const nextClubs = data.clubExperience.filter((_, itemIndex) => itemIndex !== index)
    onChange({ ...data, clubExperience: nextClubs })
    if (nextClubs.length === 0) {
      onModuleFocus('clubExperience')
      return
    }

    onModuleFocus(`club-${Math.min(index, nextClubs.length - 1)}`)
  }

  const updateSummary = (value: string) => {
    onChange({ ...data, personalSummary: value })
  }

  const updateCustomModuleContent = (moduleId: string, content: string) => {
    onChange({
      ...data,
      modules: data.modules.map(module => (
        module.id === moduleId && module.type === 'custom'
          ? { ...module, content }
          : module
      )),
    })
  }

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <h2>简历编辑器</h2>
        <span className="editor-subtitle">左侧只编辑当前模块，切换入口已移动到右侧悬浮面板</span>
      </div>

      <div className="editor-body">
        {activeModuleId === 'basicInfo' && basicInfoModule ? (
          <EditorSection
            eyebrow="固定模块"
            title={getModuleTitle(basicInfoModule)}
            description="个人信息模块不可删除、不可排序，仅保留单实例。"
          >
            <div className="form-grid">
              <FormField label="姓名" value={data.basicInfo.name} onChange={value => updateBasicInfo('name', value)} />
              <FormField label="电话" value={data.basicInfo.phone} onChange={value => updateBasicInfo('phone', value)} />
              <FormField label="邮箱" value={data.basicInfo.email} onChange={value => updateBasicInfo('email', value)} />
              <FormField label="年龄" value={data.basicInfo.age} onChange={value => updateBasicInfo('age', value)} />
              <FormField label="性别" value={data.basicInfo.gender} onChange={value => updateBasicInfo('gender', value)} />
              <FormField label="婚姻状况" value={data.basicInfo.maritalStatus} onChange={value => updateBasicInfo('maritalStatus', value)} />
              <FormField label="当前状态" value={data.basicInfo.currentStatus} onChange={value => updateBasicInfo('currentStatus', value)} />
              <FormField label="意向城市" value={data.basicInfo.targetCity} onChange={value => updateBasicInfo('targetCity', value)} />
              <FormField label="期望职位" value={data.basicInfo.expectedPosition} onChange={value => updateBasicInfo('expectedPosition', value)} />
              <FormField label="最低薪资" value={data.basicInfo.salaryMin} onChange={value => updateBasicInfo('salaryMin', value)} />
              <FormField label="最高薪资" value={data.basicInfo.salaryMax} onChange={value => updateBasicInfo('salaryMax', value)} />
              <FormField label="个人网站" value={data.basicInfo.personalWebsite} onChange={value => updateBasicInfo('personalWebsite', value)} />
              <FormField label="微信" value={data.basicInfo.wechat} onChange={value => updateBasicInfo('wechat', value)} />
              <FormField label="LinkedIn" value={data.basicInfo.linkedin} onChange={value => updateBasicInfo('linkedin', value)} />
              <FormField label="身高" value={data.basicInfo.height} onChange={value => updateBasicInfo('height', value)} />
              <FormField label="体重" value={data.basicInfo.weight} onChange={value => updateBasicInfo('weight', value)} />
              <FormField label="民族" value={data.basicInfo.ethnicity} onChange={value => updateBasicInfo('ethnicity', value)} />
              <FormField label="籍贯" value={data.basicInfo.nativePlace} onChange={value => updateBasicInfo('nativePlace', value)} />
              <FormField label="星座" value={data.basicInfo.zodiac} onChange={value => updateBasicInfo('zodiac', value)} />
              <FormField label="MBTI" value={data.basicInfo.mbti} onChange={value => updateBasicInfo('mbti', value)} />
              <FormSelect
                label="政治面貌"
                value={data.basicInfo.politicalStatus}
                options={['中共党员', '中共预备党员', '共青团员', '群众']}
                onChange={value => updateBasicInfo('politicalStatus', value)}
              />
            </div>
          </EditorSection>
        ) : null}

        {activeModuleId === 'education' && educationModule ? (
          <EmptySection
            title={getModuleTitle(educationModule)}
            titleEditor={(
              <ModuleTitleInput
                value={educationModule.title}
                onChange={value => updateModuleTitle(educationModule.id, value)}
              />
            )}
            description="当前还没有教育经历条目，先新增一条再开始编辑。"
            actionLabel="+ 添加教育经历"
            onAction={addEducation}
          />
        ) : null}

        {activeEducationIndex !== null && educationModule && data.education[activeEducationIndex] ? (
          <EditorSection
            eyebrow="教育经历"
            title={`${getModuleTitle(educationModule)} ${activeEducationIndex + 1}`}
            description={`当前共 ${data.education.length} 条，右侧可以快速切换其它条目。`}
            titleEditor={(
              <ModuleTitleInput
                value={educationModule.title}
                onChange={value => updateModuleTitle(educationModule.id, value)}
              />
            )}
            actions={(
              <>
                <button type="button" className="editor-action-btn" onClick={addEducation}>新增同类条目</button>
                <button type="button" className="editor-action-btn danger" onClick={() => removeEducation(activeEducationIndex)}>删除当前条目</button>
              </>
            )}
          >
            <div className="form-grid">
              <FormField label="学校" value={data.education[activeEducationIndex].school} onChange={value => updateEducation(activeEducationIndex, 'school', value)} />
              <FormField label="专业" value={data.education[activeEducationIndex].major} onChange={value => updateEducation(activeEducationIndex, 'major', value)} />
              <FormField label="学位" value={data.education[activeEducationIndex].degree} onChange={value => updateEducation(activeEducationIndex, 'degree', value)} />
              <FormField label="院系" value={data.education[activeEducationIndex].department} onChange={value => updateEducation(activeEducationIndex, 'department', value)} />
              <FormField label="学习形式" value={data.education[activeEducationIndex].studyType} onChange={value => updateEducation(activeEducationIndex, 'studyType', value)} />
              <MonthField label="开始时间" value={data.education[activeEducationIndex].startDate} onChange={value => updateEducation(activeEducationIndex, 'startDate', value)} />
              <MonthField label="结束时间" value={data.education[activeEducationIndex].endDate} onChange={value => updateEducation(activeEducationIndex, 'endDate', value)} allowPresent />
              <FormField label="城市" value={data.education[activeEducationIndex].city} onChange={value => updateEducation(activeEducationIndex, 'city', value)} />
            </div>
            <div className="md-field-wrapper">
              <label className="form-label">在校描述</label>
              <MarkdownEditor
                value={data.education[activeEducationIndex].description || ''}
                onChange={value => updateEducation(activeEducationIndex, 'description', value)}
                placeholder="使用 Markdown 编写在校经历..."
              />
            </div>
          </EditorSection>
        ) : null}

        {activeModuleId === 'workExperience' && workModule ? (
          <EmptySection
            title={getModuleTitle(workModule)}
            titleEditor={(
              <ModuleTitleInput
                value={workModule.title}
                onChange={value => updateModuleTitle(workModule.id, value)}
              />
            )}
            description="当前还没有工作经历条目，先新增一条再开始编辑。"
            actionLabel="+ 添加工作经历"
            onAction={addWork}
          />
        ) : null}

        {activeWorkIndex !== null && workModule && data.workExperience[activeWorkIndex] ? (
          <EditorSection
            eyebrow="工作经历"
            title={`${getModuleTitle(workModule)} ${activeWorkIndex + 1}`}
            description={`当前共 ${data.workExperience.length} 条，右侧可以切换其它公司经历。`}
            titleEditor={(
              <ModuleTitleInput
                value={workModule.title}
                onChange={value => updateModuleTitle(workModule.id, value)}
              />
            )}
            actions={(
              <>
                <button type="button" className="editor-action-btn" onClick={addWork}>新增同类条目</button>
                <button type="button" className="editor-action-btn danger" onClick={() => removeWork(activeWorkIndex)}>删除当前条目</button>
              </>
            )}
          >
            <div className="form-grid">
              <FormField label="公司" value={data.workExperience[activeWorkIndex].company} onChange={value => updateWork(activeWorkIndex, 'company', value)} />
              <FormField label="职位" value={data.workExperience[activeWorkIndex].position} onChange={value => updateWork(activeWorkIndex, 'position', value)} />
              <FormField label="部门" value={data.workExperience[activeWorkIndex].department} onChange={value => updateWork(activeWorkIndex, 'department', value)} />
              <MonthField label="开始时间" value={data.workExperience[activeWorkIndex].startDate} onChange={value => updateWork(activeWorkIndex, 'startDate', value)} />
              <MonthField
                label="结束时间"
                value={data.workExperience[activeWorkIndex].isCurrent ? '至今' : data.workExperience[activeWorkIndex].endDate}
                onChange={value => {
                  if (value === '至今') {
                    updateWork(activeWorkIndex, 'isCurrent', true)
                    updateWork(activeWorkIndex, 'endDate', '')
                    return
                  }

                  updateWork(activeWorkIndex, 'isCurrent', false)
                  updateWork(activeWorkIndex, 'endDate', value)
                }}
                allowPresent
              />
              <FormField label="城市" value={data.workExperience[activeWorkIndex].city} onChange={value => updateWork(activeWorkIndex, 'city', value)} />
            </div>
            <div className="md-field-wrapper">
              <label className="form-label">工作描述</label>
              <MarkdownEditor
                value={data.workExperience[activeWorkIndex].description || ''}
                onChange={value => updateWork(activeWorkIndex, 'description', value)}
                placeholder="使用 Markdown 编写工作内容..."
              />
            </div>
          </EditorSection>
        ) : null}

        {activeModuleId === 'projectExperience' && projectModule ? (
          <EmptySection
            title={getModuleTitle(projectModule)}
            titleEditor={(
              <ModuleTitleInput
                value={projectModule.title}
                onChange={value => updateModuleTitle(projectModule.id, value)}
              />
            )}
            description="当前还没有项目经历条目，先新增一条再开始编辑。"
            actionLabel="+ 添加项目经历"
            onAction={addProject}
          />
        ) : null}

        {activeProjectIndex !== null && projectModule && data.projectExperience[activeProjectIndex] ? (
          <ExperienceEditorSection
            eyebrow="项目经历"
            title={getModuleTitle(projectModule) + ' ' + (activeProjectIndex + 1)}
            description={'当前共 ' + data.projectExperience.length + ' 条，右侧可以快速切换其它项目。'}
            titleEditor={(
              <ModuleTitleInput
                value={projectModule.title}
                onChange={value => updateModuleTitle(projectModule.id, value)}
              />
            )}
            item={data.projectExperience[activeProjectIndex]}
            onAdd={addProject}
            onRemove={() => removeProject(activeProjectIndex)}
            onChange={(field, value) => updateProject(activeProjectIndex, field, value)}
          />
        ) : null}

        {activeModuleId === 'clubExperience' && clubModule ? (
          <EmptySection
            title={getModuleTitle(clubModule)}
            titleEditor={(
              <ModuleTitleInput
                value={clubModule.title}
                onChange={value => updateModuleTitle(clubModule.id, value)}
              />
            )}
            description="当前还没有社团和组织经历条目，先新增一条再开始编辑。"
            actionLabel="+ 添加社团经历"
            onAction={addClub}
          />
        ) : null}

        {activeClubIndex !== null && clubModule && data.clubExperience[activeClubIndex] ? (
          <ExperienceEditorSection
            eyebrow="社团和组织经历"
            title={getModuleTitle(clubModule) + ' ' + (activeClubIndex + 1)}
            description={'当前共 ' + data.clubExperience.length + ' 条，右侧可以快速切换其它经历。'}
            titleEditor={(
              <ModuleTitleInput
                value={clubModule.title}
                onChange={value => updateModuleTitle(clubModule.id, value)}
              />
            )}
            item={data.clubExperience[activeClubIndex]}
            onAdd={addClub}
            onRemove={() => removeClub(activeClubIndex)}
            onChange={(field, value) => updateClub(activeClubIndex, field, value)}
          />
        ) : null}

        {activeModuleId === 'personalSummary' && summaryModule ? (
          <EditorSection
            eyebrow="Markdown 模块"
            title={getModuleTitle(summaryModule)}
            description="适合摘要、技能概览等整体性内容。"
            titleEditor={(
              <ModuleTitleInput
                value={summaryModule.title}
                onChange={value => updateModuleTitle(summaryModule.id, value)}
              />
            )}
          >
            <MarkdownEditor
              value={data.personalSummary || ''}
              onChange={updateSummary}
              placeholder="使用 Markdown 格式编写个人总结..."
            />
          </EditorSection>
        ) : null}

        {activeCustomModule ? (
          <EditorSection
            eyebrow="自定义大模块"
            title={getModuleTitle(activeCustomModule)}
            description="该模块会按右侧标题展示在预览区，内容支持基础 Markdown 排版。"
            titleEditor={(
              <ModuleTitleInput
                value={activeCustomModule.title}
                onChange={value => updateModuleTitle(activeCustomModule.id, value)}
              />
            )}
          >
            <MarkdownEditor
              value={activeCustomModule.content || ''}
              onChange={value => updateCustomModuleContent(activeCustomModule.id, value)}
              placeholder="输入这个大模块的内容..."
            />
          </EditorSection>
        ) : null}

        {!hasVisibleEditor(activeModuleId) && !activeCustomModule ? (
          <EmptySection
            title="请选择模块"
            description="从右侧悬浮模块面板或预览区点击一个模块后，这里会只显示它的编辑内容。"
          />
        ) : null}
      </div>
    </div>
  )
}

export default memo(EditorPanel)

function EditorSection({
  eyebrow,
  title,
  description,
  titleEditor,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  titleEditor?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="editor-section-card">
      <div className="editor-section-top">
        <div>
          <span className="editor-eyebrow">{eyebrow}</span>
          {titleEditor || <h3 className="editor-section-title">{title}</h3>}
          <p className="editor-section-desc">{description}</p>
        </div>
        {actions ? <div className="editor-section-actions">{actions}</div> : null}
      </div>
      <div className="editor-section-content">{children}</div>
    </section>
  )
}

function ModuleTitleInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="editor-module-title-field">
      <span className="form-label">模块标题</span>
      <input
        className="editor-module-title-input"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="输入模块标题"
      />
    </label>
  )
}

function EmptySection({
  title,
  titleEditor,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  titleEditor?: ReactNode
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <section className="editor-empty-card">
      {titleEditor || <h3>{title}</h3>}
      <p>{description}</p>
      {actionLabel && onAction ? (
        <button type="button" className="editor-primary-btn" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}

function ExperienceEditorSection({
  eyebrow,
  title,
  description,
  titleEditor,
  item,
  onAdd,
  onRemove,
  onChange,
}: {
  eyebrow: string
  title: string
  description: string
  titleEditor: ReactNode
  item: WorkItem
  onAdd: () => void
  onRemove: () => void
  onChange: (field: keyof WorkItem, value: string | boolean) => void
}) {
  return (
    <EditorSection
      eyebrow={eyebrow}
      title={title}
      description={description}
      titleEditor={titleEditor}
      actions={(
        <>
          <button type="button" className="editor-action-btn" onClick={onAdd}>新增同类条目</button>
          <button type="button" className="editor-action-btn danger" onClick={onRemove}>删除当前条目</button>
        </>
      )}
    >
      <div className="form-grid">
        <FormField label="名称" value={item.company} onChange={value => onChange('company', value)} />
        <FormField label="职位/角色" value={item.position} onChange={value => onChange('position', value)} />
        <FormField label="部门" value={item.department} onChange={value => onChange('department', value)} />
        <MonthField label="开始时间" value={item.startDate} onChange={value => onChange('startDate', value)} />
        <MonthField
          label="结束时间"
          value={item.isCurrent ? '至今' : item.endDate}
          onChange={value => {
            if (value === '至今') {
              onChange('isCurrent', true)
              onChange('endDate', '')
              return
            }

            onChange('isCurrent', false)
            onChange('endDate', value)
          }}
          allowPresent
        />
        <FormField label="城市" value={item.city} onChange={value => onChange('city', value)} />
      </div>
      <div className="md-field-wrapper">
        <label className="form-label">经历描述</label>
        <MarkdownEditor
          value={item.description || ''}
          onChange={value => onChange('description', value)}
          placeholder="使用 Markdown 编写经历内容..."
        />
      </div>
    </EditorSection>
  )
}

function FormField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type="text"
        value={value}
        onChange={event => onChange(event.target.value)}
        disabled={disabled}
      />
    </div>
  )
}

function FormSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <select className="form-select" value={value} onChange={event => onChange(event.target.value)}>
        <option value="">请选择</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function MonthField({
  label,
  value,
  onChange,
  allowPresent = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  allowPresent?: boolean
}) {
  const parsedValue = useMemo(() => parseMonthValue(value), [value])
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: currentYear - 1980 + 6 }, (_, index) => String(currentYear + 5 - index))
  }, [])

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')),
    [],
  )

  const handleYearChange = (nextYear: string) => {
    if (!nextYear) {
      onChange('')
      return
    }

    onChange(formatMonthValue(nextYear, parsedValue.month || '01'))
  }

  const handleMonthChange = (nextMonth: string) => {
    if (!nextMonth || !parsedValue.year) {
      onChange('')
      return
    }

    onChange(formatMonthValue(parsedValue.year, nextMonth))
  }

  const handlePresentToggle = () => {
    onChange(parsedValue.isPresent ? '' : '至今')
  }

  return (
    <div className="form-field month-field">
      <label className="form-label">{label}</label>
      <div className="month-field-controls">
        <select
          className="form-select month-select"
          value={parsedValue.isPresent ? '' : parsedValue.year}
          onChange={event => handleYearChange(event.target.value)}
          disabled={parsedValue.isPresent}
        >
          <option value="">年份</option>
          {years.map(year => (
            <option key={year} value={year}>
              {year}年
            </option>
          ))}
        </select>
        <select
          className="form-select month-select"
          value={parsedValue.isPresent ? '' : parsedValue.month}
          onChange={event => handleMonthChange(event.target.value)}
          disabled={parsedValue.isPresent || !parsedValue.year}
        >
          <option value="">月份</option>
          {months.map(month => (
            <option key={month} value={month}>
              {month}月
            </option>
          ))}
        </select>
        {allowPresent ? (
          <button
            type="button"
            className={`present-toggle${parsedValue.isPresent ? ' active' : ''}`}
            onClick={handlePresentToggle}
          >
            至今
          </button>
        ) : null}
      </div>
    </div>
  )
}

function parseMonthValue(value: string) {
  if (!value) {
    return { year: '', month: '', isPresent: false }
  }

  if (value === '至今') {
    return { year: '', month: '', isPresent: true }
  }

  const match = value.match(/(\d{4})\D*(\d{1,2})?/)
  if (!match) {
    return { year: '', month: '', isPresent: false }
  }

  return {
    year: match[1] || '',
    month: match[2] ? match[2].padStart(2, '0') : '',
    isPresent: false,
  }
}

function formatMonthValue(year: string, month: string) {
  if (!year || !month) return ''
  return `${year}年${month}月`
}

function getIndexedPosition(activeModuleId: string | null, prefix: 'edu' | 'work' | 'project' | 'club') {
  if (!activeModuleId) {
    return null
  }

  const match = activeModuleId.match(new RegExp(`^${prefix}-(\\d+)$`))
  return match ? Number(match[1]) : null
}

function getModuleTitle(module: ResumeModule) {
  if (module.type === 'custom') {
    return module.title.trim() || '自定义模块'
  }

  return module.title.trim() || DEFAULT_MODULE_TITLES[module.type]
}

function hasVisibleEditor(activeModuleId: string | null) {
  if (!activeModuleId) {
    return false
  }

  return (
    activeModuleId === 'basicInfo'
    || activeModuleId === 'education'
    || activeModuleId === 'workExperience'
    || activeModuleId === 'projectExperience'
    || activeModuleId === 'clubExperience'
    || activeModuleId === 'personalSummary'
    || activeModuleId.startsWith('edu-')
    || activeModuleId.startsWith('work-')
    || activeModuleId.startsWith('project-')
    || activeModuleId.startsWith('club-')
  )
}

function createEmptyWorkItem(): WorkItem {
  return {
    company: '',
    position: '',
    department: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    city: '',
    description: '',
  }
}
