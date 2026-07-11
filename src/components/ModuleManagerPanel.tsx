import { memo, useMemo } from 'react'
import {
  DEFAULT_MODULE_TITLES,
  type BuiltInResumeModuleType,
  type ResumeData,
  type ResumeModule,
} from '../data/resumeData'
import { getModuleSelectionId } from '../utils/moduleSelection'
import './ModuleManagerPanel.css'

interface ModuleManagerPanelProps {
  data: ResumeData
  onChange: (data: ResumeData) => void
  activeModuleId: string | null
  onSelectModule: (id: string) => void
}

const OPTIONAL_MODULE_TYPES: BuiltInResumeModuleType[] = [
  'education',
  'workExperience',
  'projectExperience',
  'clubExperience',
  'personalSummary',
]

function ModuleManagerPanel({
  data,
  onChange,
  activeModuleId,
  onSelectModule,
}: ModuleManagerPanelProps) {
  const availableBuiltInModules = useMemo(
    () => OPTIONAL_MODULE_TYPES.filter(type => !data.modules.some(module => module.type === type)),
    [data.modules],
  )

  const updateModules = (modules: ResumeModule[]) => {
    onChange({ ...data, modules })
  }

  const updateModuleTitle = (moduleId: string, title: string) => {
    updateModules(data.modules.map(module => (
      module.id === moduleId ? { ...module, title } : module
    )))
  }

  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    const index = data.modules.findIndex(module => module.id === moduleId)
    if (index === -1) return

    const module = data.modules[index]
    if (module.type === 'basicInfo') return

    const nextIndex = direction === 'up' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= data.modules.length) return

    if (data.modules[nextIndex].type === 'basicInfo') return

    const nextModules = [...data.modules]
    ;[nextModules[index], nextModules[nextIndex]] = [nextModules[nextIndex], nextModules[index]]
    updateModules(nextModules)
  }

  const removeModule = (moduleId: string) => {
    const module = data.modules.find(item => item.id === moduleId)
    if (!module || module.type === 'basicInfo') return

    updateModules(data.modules.filter(item => item.id !== moduleId))
  }

  const addBuiltInModule = (type: BuiltInResumeModuleType) => {
    if (data.modules.some(module => module.type === type)) return

    const nextModule: ResumeModule = {
      id: type,
      type,
      title: DEFAULT_MODULE_TITLES[type],
    }

    updateModules([...data.modules, nextModule])
    onSelectModule(getModuleSelectionId({ ...data, modules: [...data.modules, nextModule] }, nextModule))
  }

  const addCustomModule = () => {
    const nextModule: ResumeModule = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      title: '自定义模块',
      content: '',
    }

    updateModules([...data.modules, nextModule])
    onSelectModule(nextModule.id)
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
    onSelectModule(`edu-${nextData.education.length - 1}`)
  }

  const removeEducation = (index: number) => {
    const nextData = {
      ...data,
      education: data.education.filter((_, itemIndex) => itemIndex !== index),
    }
    onChange(nextData)
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
    onSelectModule(`work-${nextData.workExperience.length - 1}`)
  }

  const removeWork = (index: number) => {
    const nextData = {
      ...data,
      workExperience: data.workExperience.filter((_, itemIndex) => itemIndex !== index),
    }
    onChange(nextData)
  }

  const addProject = () => {
    const nextData = {
      ...data,
      projectExperience: [...data.projectExperience, createEmptyWorkItem()],
    }
    onChange(nextData)
    onSelectModule('project-' + (nextData.projectExperience.length - 1))
  }

  const removeProject = (index: number) => {
    onChange({
      ...data,
      projectExperience: data.projectExperience.filter((_, itemIndex) => itemIndex !== index),
    })
  }

  const addClub = () => {
    const nextData = {
      ...data,
      clubExperience: [...data.clubExperience, createEmptyWorkItem()],
    }
    onChange(nextData)
    onSelectModule('club-' + (nextData.clubExperience.length - 1))
  }

  const removeClub = (index: number) => {
    onChange({
      ...data,
      clubExperience: data.clubExperience.filter((_, itemIndex) => itemIndex !== index),
    })
  }

  return (
    <aside className="module-sidebar">
      <div className="module-sidebar-card">
        <div className="module-sidebar-list">
          {data.modules.map(module => {
            const moduleSelectionId = getModuleSelectionId(data, module)
            const isActive = isModuleActive(module, activeModuleId)
            const isFixed = module.type === 'basicInfo'

            return (
              <section key={module.id} className={`module-card${isActive ? ' active' : ''}`}>
                <button
                  type="button"
                  className="module-card-anchor"
                  onClick={() => onSelectModule(moduleSelectionId)}
                >
                  <span className="module-card-value">{getModuleTitle(module)}</span>
                </button>

                <div className="module-card-body">
                  <input
                    className="module-card-input"
                    value={module.title}
                    onChange={event => updateModuleTitle(module.id, event.target.value)}
                    disabled={isFixed}
                    placeholder={getModuleTitle(module)}
                  />

                  <div className="module-card-actions">
                    <button
                      type="button"
                      className="module-card-btn"
                      onClick={() => moveModule(module.id, 'up')}
                      disabled={isFixed}
                      title="上移"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="module-card-btn"
                      onClick={() => moveModule(module.id, 'down')}
                      disabled={isFixed}
                      title="下移"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="module-card-btn danger"
                      onClick={() => removeModule(module.id)}
                      disabled={isFixed}
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>

                  {module.type === 'education' ? (
                    <div className="module-children">
                      <div className="module-children-list">
                        {data.education.map((item, index) => (
                          <button
                            key={`edu-${index}`}
                            type="button"
                            className={`module-child-chip${activeModuleId === `edu-${index}` ? ' active' : ''}`}
                            onClick={() => onSelectModule(`edu-${index}`)}
                          >
                            <span>{`教育 ${index + 1}`}</span>
                            <span>{item.school || '未填写学校'}</span>
                          </button>
                        ))}
                      </div>
                      <div className="module-child-actions">
                        <button type="button" className="module-inline-btn" onClick={addEducation}>
                          + 添加条目
                        </button>
                        {activeModuleId?.startsWith('edu-') ? (
                          <button
                            type="button"
                            className="module-inline-btn danger"
                            onClick={() => removeEducation(Number(activeModuleId.replace('edu-', '')))}
                          >
                            删除当前
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {module.type === 'workExperience' ? (
                    <div className="module-children">
                      <div className="module-children-list">
                        {data.workExperience.map((item, index) => (
                          <button
                            key={`work-${index}`}
                            type="button"
                            className={`module-child-chip${activeModuleId === `work-${index}` ? ' active' : ''}`}
                            onClick={() => onSelectModule(`work-${index}`)}
                          >
                            <span>{`工作 ${index + 1}`}</span>
                            <span>{item.company || '未填写公司'}</span>
                          </button>
                        ))}
                      </div>
                      <div className="module-child-actions">
                        <button type="button" className="module-inline-btn" onClick={addWork}>
                          + 添加条目
                        </button>
                        {activeModuleId?.startsWith('work-') ? (
                          <button
                            type="button"
                            className="module-inline-btn danger"
                            onClick={() => removeWork(Number(activeModuleId.replace('work-', '')))}
                          >
                            删除当前
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {module.type === 'projectExperience' ? (
                    <ExperienceChildren
                      items={data.projectExperience}
                      prefix="project"
                      label="项目"
                      activeModuleId={activeModuleId}
                      onSelectModule={onSelectModule}
                      onAdd={addProject}
                      onRemove={removeProject}
                    />
                  ) : null}

                  {module.type === 'clubExperience' ? (
                    <ExperienceChildren
                      items={data.clubExperience}
                      prefix="club"
                      label="社团"
                      activeModuleId={activeModuleId}
                      onSelectModule={onSelectModule}
                      onAdd={addClub}
                      onRemove={removeClub}
                    />
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>

        <div className="module-sidebar-footer">
          <span className="module-footer-label">新增大模块</span>
          <div className="module-footer-actions">
            {availableBuiltInModules.map(type => (
              <button
                key={type}
                type="button"
                className="module-footer-btn"
                onClick={() => addBuiltInModule(type)}
              >
                + {DEFAULT_MODULE_TITLES[type]}
              </button>
            ))}
            <button type="button" className="module-footer-btn accent" onClick={addCustomModule}>
              + 自定义模块
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default memo(ModuleManagerPanel)

function getModuleTitle(module: ResumeModule) {
  if (module.type === 'custom') {
    return module.title.trim() || '自定义模块'
  }

  return module.title.trim() || DEFAULT_MODULE_TITLES[module.type]
}

function isModuleActive(module: ResumeModule, activeModuleId: string | null) {
  if (!activeModuleId) {
    return false
  }

  if (module.type === 'education') {
    return activeModuleId === 'education' || activeModuleId.startsWith('edu-')
  }

  if (module.type === 'workExperience') {
    return activeModuleId === 'workExperience' || activeModuleId.startsWith('work-')
  }

  if (module.type === 'projectExperience') {
    return activeModuleId === 'projectExperience' || activeModuleId.startsWith('project-')
  }

  if (module.type === 'clubExperience') {
    return activeModuleId === 'clubExperience' || activeModuleId.startsWith('club-')
  }

  return module.id === activeModuleId
}

function ExperienceChildren({
  items,
  prefix,
  label,
  activeModuleId,
  onSelectModule,
  onAdd,
  onRemove,
}: {
  items: ResumeData['workExperience']
  prefix: 'project' | 'club'
  label: string
  activeModuleId: string | null
  onSelectModule: (id: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="module-children">
      <div className="module-children-list">
        {items.map((item, index) => (
          <button
            key={prefix + '-' + index}
            type="button"
            className={'module-child-chip' + (activeModuleId === prefix + '-' + index ? ' active' : '')}
            onClick={() => onSelectModule(prefix + '-' + index)}
          >
            <span>{label + ' ' + (index + 1)}</span>
            <span>{item.company || '未填写名称'}</span>
          </button>
        ))}
      </div>
      <div className="module-child-actions">
        <button type="button" className="module-inline-btn" onClick={onAdd}>
          + 添加条目
        </button>
        {activeModuleId?.startsWith(prefix + '-') ? (
          <button
            type="button"
            className="module-inline-btn danger"
            onClick={() => onRemove(Number(activeModuleId.replace(prefix + '-', '')))}
          >
            删除当前
          </button>
        ) : null}
      </div>
    </div>
  )
}

function createEmptyWorkItem(): ResumeData['workExperience'][0] {
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
