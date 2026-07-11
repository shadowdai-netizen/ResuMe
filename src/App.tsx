import { useRef, useState, useCallback, useEffect } from 'react'
import './App.css'
import ResumePreview, { type PreviewSettings, type ProfileStyleVariant, type TitleStyleVariant } from './components/ResumePreview'
import EditorPanel from './components/EditorPanel'
import ModuleManagerPanel from './components/ModuleManagerPanel'
import ResumeLibraryPanel from './components/ResumeLibraryPanel'
import { resumeData as defaultData } from './data/resumeData'
import type { ResumeData } from './data/resumeData'
import { getDefaultActiveModuleId, isActiveModuleIdValid } from './utils/moduleSelection'
import { createResumeSkillMarkdown, parseResumeSchemaJson, parseResumeSkillMarkdown } from './utils/resumeSchema'
import {
  createResumeId,
  deleteStoredResume,
  listStoredResumes,
  saveStoredResume,
  type StoredResume,
} from './utils/resumeStorage'

const FONT_OPTIONS = [
  { label: '现代黑体', value: '"PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: '宋体书卷', value: '"Songti SC", "STSong", serif' },
  { label: '国际简洁', value: '"Helvetica Neue", Arial, sans-serif' },
  { label: '人文无衬线', value: '"Noto Sans SC", "Source Han Sans CN", sans-serif' },
]

const TITLE_STYLE_OPTIONS: Array<{ value: TitleStyleVariant; label: string; description: string }> = [
  { value: 'classic', label: '经典竖线', description: '稳妥、专业、信息密度高' },
  { value: 'banner', label: '横幅标签', description: '更醒目，适合强调分段感' },
  { value: 'underline', label: '重线标题', description: '更现代，视觉更轻' },
  { value: 'capsule', label: '矩形横条', description: '色块醒目，适合强化分区层次' },
]

const PROFILE_STYLE_OPTIONS: Array<{ value: ProfileStyleVariant; label: string; description: string }> = [
  { value: 'classic', label: '经典横排', description: '信息清晰，适合大多数简历' },
  { value: 'centered', label: '居中名片', description: '更轻盈，突出姓名与联系方式' },
  { value: 'card', label: '强调卡片', description: '增加层次，适合个性化简历' },
  { value: 'split', label: '左右分栏', description: '姓名与资料分区展示' },
]

const COLOR_PRESETS = ['#111827', '#1f3a5f', '#14532d', '#7c2d12', '#4c1d95']
const TITLE_BAR_COLOR_PRESETS = ['#111827', '#1e3a5f', '#0f766e', '#9a3412', '#be123c', '#4d7c0f', '#a16207']
const DEFAULT_PREVIEW_SETTINGS: PreviewSettings = {
  fontFamily: FONT_OPTIONS[0].value,
  fontSize: 12,
  lineHeight: 1.75,
  textColor: '#111827',
  moduleSpacing: 5,
  pageVerticalMargin: 5,
  pageHorizontalMargin: 10,
  titleStyle: 'classic',
  profileStyle: 'classic',
  onePageMode: false,
  titleBarColor: '#111827',
}

function normalizeStoredResume(resume: StoredResume): StoredResume {
  let data = resume.data

  try {
    data = parseResumeSchemaJson(JSON.stringify(resume.data))
  } catch {
    // Keep the record readable even if an older version stored incomplete data.
  }

  return {
    ...resume,
    data,
    config: { ...DEFAULT_PREVIEW_SETTINGS, ...resume.config },
  }
}

function App() {
  const resumeRef = useRef<HTMLDivElement>(null)
  const schemaInputRef = useRef<HTMLInputElement>(null)
  const [resumeData, setResumeData] = useState<ResumeData>(defaultData)
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [activePreviewTab, setActivePreviewTab] = useState<'typography' | 'titles'>('typography')
  const [schemaFeedback, setSchemaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [previewPageCount, setPreviewPageCount] = useState(1)
  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>(DEFAULT_PREVIEW_SETTINGS)
  const [storedResumes, setStoredResumes] = useState<StoredResume[]>([])
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null)
  const [isResumeLibraryOpen, setIsResumeLibraryOpen] = useState(false)
  const [storageLoading, setStorageLoading] = useState(true)
  const [storageReady, setStorageReady] = useState(false)
  const storageInitializedRef = useRef(false)
  const activeStoredResumeRef = useRef<StoredResume | null>(null)

  const handleExportPDF = async () => {
    // 使用浏览器原生打印，用户可选择"另存为 PDF"
    window.print()
  }

  const handleModuleHover = useCallback((moduleId: string | null) => {
    // Preview-only hover — no state change needed for visual highlighting
  }, [])

  const handleModuleClick = useCallback((moduleId: string) => {
    setActiveModule(moduleId)
  }, [])

  const handleOnePage = useCallback(() => {
    if (previewPageCount <= 1) {
      return
    }

    setPreviewSettings(prev => ({ ...prev, onePageMode: true }))
  }, [previewPageCount])

  const handleResetPreviewSettings = useCallback(() => {
    setPreviewSettings(DEFAULT_PREVIEW_SETTINGS)
  }, [])

  const handleSelectResume = useCallback((resume: StoredResume) => {
    activeStoredResumeRef.current = resume
    setActiveResumeId(resume.id)
    setResumeData(resume.data)
    setPreviewSettings(resume.config)
    setActiveModule(getDefaultActiveModuleId(resume.data))
    setIsResumeLibraryOpen(false)
  }, [])

  const handleCreateResume = useCallback(async () => {
    const name = window.prompt('请输入新简历名称', `简历 ${storedResumes.length + 1}`)?.trim()
    if (!name) return

    setStorageLoading(true)
    try {
      const resume = await saveStoredResume(createResumeId(), name, defaultData, DEFAULT_PREVIEW_SETTINGS)
      activeStoredResumeRef.current = resume
      setStoredResumes(previous => [resume, ...previous])
      setActiveResumeId(resume.id)
      setResumeData(resume.data)
      setPreviewSettings(resume.config)
      setActiveModule(getDefaultActiveModuleId(resume.data))
      setIsResumeLibraryOpen(false)
    } catch (error) {
      setSchemaFeedback({ type: 'error', message: error instanceof Error ? error.message : '新建简历失败。' })
    } finally {
      setStorageLoading(false)
    }
  }, [storedResumes.length])

  const handleRenameResume = useCallback(async (resume: StoredResume) => {
    const name = window.prompt('请输入新的简历名称', resume.name)?.trim()
    if (!name || name === resume.name) return

    setStorageLoading(true)
    try {
      const renamed = await saveStoredResume(
        resume.id,
        name,
        resume.data,
        resume.config,
        { createdAt: resume.createdAt, updatedAt: Date.now() },
      )
      activeStoredResumeRef.current = activeResumeId === resume.id ? renamed : activeStoredResumeRef.current
      setStoredResumes(previous => previous.map(item => item.id === renamed.id ? renamed : item))
    } catch (error) {
      setSchemaFeedback({ type: 'error', message: error instanceof Error ? error.message : '重命名简历失败。' })
    } finally {
      setStorageLoading(false)
    }
  }, [activeResumeId])

  const handleDeleteResume = useCallback(async (resume: StoredResume) => {
    if (storedResumes.length <= 1 || !window.confirm(`确定删除“${resume.name}”吗？`)) return

    setStorageLoading(true)
    try {
      await deleteStoredResume(resume.id)
      const remaining = storedResumes.filter(item => item.id !== resume.id)
      setStoredResumes(remaining)

      if (activeResumeId === resume.id) {
        handleSelectResume(remaining[0])
      }
    } catch (error) {
      setSchemaFeedback({ type: 'error', message: error instanceof Error ? error.message : '删除简历失败。' })
    } finally {
      setStorageLoading(false)
    }
  }, [activeResumeId, handleSelectResume, storedResumes])

  const handleExportSchema = useCallback(() => {
    const markdown = createResumeSkillMarkdown(resumeData)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStamp = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `简历-${dateStamp}.md`
    link.click()
    window.URL.revokeObjectURL(url)

    setSchemaFeedback({ type: 'success', message: '已导出 Markdown Skill 文件。' })
  }, [resumeData])

  const handleImportButtonClick = useCallback(() => {
    schemaInputRef.current?.click()
  }, [])

  const handleImportSchema = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const markdownText = await file.text()
      const importedData = parseResumeSkillMarkdown(markdownText)
      setResumeData(importedData)
      setSchemaFeedback({ type: 'success', message: `已导入 ${file.name}。` })
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入失败，请检查 Markdown Skill 内容。'
      setSchemaFeedback({ type: 'error', message })
    } finally {
      event.target.value = ''
    }
  }, [])

  useEffect(() => {
    if (isActiveModuleIdValid(resumeData, activeModule)) {
      return
    }

    setActiveModule(getDefaultActiveModuleId(resumeData))
  }, [resumeData, activeModule])

  useEffect(() => {
    if (storageInitializedRef.current) return
    storageInitializedRef.current = true

    const loadResumes = async () => {
      try {
        const resumes = (await listStoredResumes()).map(normalizeStoredResume)
        if (resumes.length > 0) {
          setStoredResumes(resumes)
          handleSelectResume(resumes[0])
        } else {
          const firstResume = await saveStoredResume(createResumeId(), '我的简历', defaultData, DEFAULT_PREVIEW_SETTINGS)
          activeStoredResumeRef.current = firstResume
          setStoredResumes([firstResume])
          setActiveResumeId(firstResume.id)
        }
        setStorageReady(true)
      } catch (error) {
        setSchemaFeedback({ type: 'error', message: error instanceof Error ? error.message : '无法初始化本地简历库。' })
      } finally {
        setStorageLoading(false)
      }
    }

    void loadResumes()
  }, [handleSelectResume])

  useEffect(() => {
    if (!storageReady || !activeResumeId || !activeStoredResumeRef.current) return

    const timer = window.setTimeout(async () => {
      const current = activeStoredResumeRef.current
      if (!current || current.id !== activeResumeId) return

      try {
        const saved = await saveStoredResume(
          current.id,
          current.name,
          resumeData,
          previewSettings,
          { createdAt: current.createdAt, updatedAt: Date.now() },
        )
        activeStoredResumeRef.current = saved
        setStoredResumes(previous => previous.map(item => item.id === saved.id ? saved : item))
      } catch (error) {
        setSchemaFeedback({ type: 'error', message: error instanceof Error ? error.message : '自动保存简历失败。' })
      }
    }, 350)

    return () => window.clearTimeout(timer)
  }, [activeResumeId, previewSettings, resumeData, storageReady])

  return (
    <div className="preview-stage-shell">
      <div className="app-layout">
        {/* Left: Editor */}
        <EditorPanel
          data={resumeData}
          onChange={setResumeData}
          activeModuleId={activeModule}
          onModuleFocus={setActiveModule}
        />

        {/* Right: Preview */}
        <div className="preview-stage">
          <div className="preview-stage-main">
            <div className="resume-preview-wrapper">
              {isResumeLibraryOpen ? (
                <ResumeLibraryPanel
                  resumes={storedResumes}
                  activeResumeId={activeResumeId}
                  loading={storageLoading}
                  onCreate={handleCreateResume}
                  onSelect={handleSelectResume}
                  onRename={handleRenameResume}
                  onDelete={handleDeleteResume}
                  onClose={() => setIsResumeLibraryOpen(false)}
                />
              ) : null}
              <div className="preview-config-shell">
                <div className="preview-tabbar">
                  <div className="preview-tabs">
                    <button
                      type="button"
                      className={`preview-tab${activePreviewTab === 'typography' ? ' active' : ''}`}
                      onClick={() => setActivePreviewTab('typography')}
                    >
                      排版
                    </button>
                    <button
                      type="button"
                      className={`preview-tab${activePreviewTab === 'titles' ? ' active' : ''}`}
                      onClick={() => setActivePreviewTab('titles')}
                    >
                      标题样式
                    </button>
                  </div>

                  <div className="toolbar">
                    <button
                      type="button"
                      className="toolbar-btn secondary"
                      onClick={() => setIsResumeLibraryOpen(previous => !previous)}
                    >
                      简历管理
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn secondary"
                      onClick={handleImportButtonClick}
                    >
                      导入 Markdown
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn secondary"
                      onClick={handleExportSchema}
                    >
                      导出 Markdown
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn primary"
                      onClick={handleExportPDF}
                    >
                      下载 PDF
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn secondary"
                      onClick={handleOnePage}
                      disabled={previewPageCount <= 1 || previewSettings.onePageMode}
                      title={previewSettings.onePageMode ? '已启用一页模式' : '仅在简历超过一页时可用'}
                    >
                      {previewSettings.onePageMode ? '已压缩一页' : '一键一页'}
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn secondary"
                      onClick={handleResetPreviewSettings}
                      title="恢复默认排版、边距和标题样式"
                    >
                      重置配置
                    </button>
                  </div>
                </div>

                {schemaFeedback ? (
                  <div className={`toolbar-feedback ${schemaFeedback.type}`}>
                    {schemaFeedback.message}
                  </div>
                ) : null}

                <div className="preview-config-panel">
                  {activePreviewTab === 'typography' ? (
                    <div className="preview-control-grid">
                      <label className="preview-control">
                        <span className="preview-control-label">字体</span>
                        <select
                          className="preview-control-select"
                          value={previewSettings.fontFamily}
                          onChange={event => setPreviewSettings(prev => ({ ...prev, fontFamily: event.target.value }))}
                        >
                          {FONT_OPTIONS.map(option => (
                            <option key={option.label} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="preview-control">
                        <span className="preview-control-label">字号</span>
                        <div className="preview-range-row">
                          <input
                            className="preview-range"
                            type="range"
                            min="10"
                            max="16"
                            step="1"
                            value={previewSettings.fontSize}
                            onChange={event => setPreviewSettings(prev => ({ ...prev, fontSize: Number(event.target.value) }))}
                          />
                          <span className="preview-range-value">{previewSettings.fontSize}px</span>
                        </div>
                      </label>

                      <label className="preview-control">
                        <span className="preview-control-label">行距</span>
                        <div className="preview-range-row">
                          <input
                            className="preview-range"
                            type="range"
                            min="1.4"
                            max="2.1"
                            step="0.05"
                            value={previewSettings.lineHeight}
                            onChange={event => setPreviewSettings(prev => ({ ...prev, lineHeight: Number(event.target.value) }))}
                          />
                          <span className="preview-range-value">{previewSettings.lineHeight.toFixed(2)}</span>
                        </div>
                      </label>

                      <label className="preview-control">
                        <span className="preview-control-label">模块间距</span>
                        <div className="preview-range-row">
                          <input
                            className="preview-range"
                            type="range"
                            min="2"
                            max="10"
                            step="0.5"
                            value={previewSettings.moduleSpacing}
                            onChange={event => setPreviewSettings(prev => ({ ...prev, moduleSpacing: Number(event.target.value) }))}
                          />
                          <span className="preview-range-value">{previewSettings.moduleSpacing.toFixed(1)}mm</span>
                        </div>
                      </label>

                      <label className="preview-control">
                        <span className="preview-control-label">A4 上下边距</span>
                        <div className="preview-range-row">
                          <input
                            className="preview-range"
                            type="range"
                            min="0"
                            max="20"
                            step="0.5"
                            value={previewSettings.pageVerticalMargin}
                            onChange={event => setPreviewSettings(prev => ({ ...prev, pageVerticalMargin: Number(event.target.value) }))}
                          />
                          <span className="preview-range-value">{previewSettings.pageVerticalMargin.toFixed(1)}mm</span>
                        </div>
                      </label>

                      <label className="preview-control">
                        <span className="preview-control-label">A4 左右边距</span>
                        <div className="preview-range-row">
                          <input
                            className="preview-range"
                            type="range"
                            min="0"
                            max="30"
                            step="0.5"
                            value={previewSettings.pageHorizontalMargin}
                            onChange={event => setPreviewSettings(prev => ({ ...prev, pageHorizontalMargin: Number(event.target.value) }))}
                          />
                          <span className="preview-range-value">{previewSettings.pageHorizontalMargin.toFixed(1)}mm</span>
                        </div>
                      </label>

                      <div className="preview-control">
                        <span className="preview-control-label">字色</span>
                        <div className="preview-color-row">
                          <div className="preview-color-swatches">
                            {COLOR_PRESETS.map(color => (
                              <button
                                key={color}
                                type="button"
                                className={`preview-color-swatch${previewSettings.textColor === color ? ' active' : ''}`}
                                style={{ background: color }}
                                onClick={() => setPreviewSettings(prev => ({ ...prev, textColor: color }))}
                                title={color}
                              />
                            ))}
                          </div>
                          <input
                            className="preview-color-picker"
                            type="color"
                            value={previewSettings.textColor}
                            onChange={event => setPreviewSettings(prev => ({ ...prev, textColor: event.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="title-style-panel">
                      <div className="style-picker-group">
                        <span className="style-picker-label">基本信息样式</span>
                        <div className="profile-style-grid">
                          {PROFILE_STYLE_OPTIONS.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              className={`profile-style-card${previewSettings.profileStyle === option.value ? ' active' : ''}`}
                              onClick={() => setPreviewSettings(prev => ({ ...prev, profileStyle: option.value }))}
                            >
                              <span className={`profile-style-preview ${option.value}`}>
                                <span className="profile-sample-name">Abbey</span>
                                <span className="profile-sample-line" />
                                <span className="profile-sample-line short" />
                              </span>
                              <span className="title-style-name">{option.label}</span>
                              <span className="title-style-desc">{option.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="style-picker-group">
                        <div className="style-picker-heading">
                          <span className="style-picker-label">大模块标题样式</span>
                          <div className="title-bar-color-control">
                            <span>标题底色</span>
                            <div className="title-bar-color-presets">
                              {TITLE_BAR_COLOR_PRESETS.map(color => (
                                <button
                                  key={color}
                                  type="button"
                                  className={`title-bar-color-swatch${previewSettings.titleBarColor === color ? ' active' : ''}`}
                                  style={{ background: color }}
                                  onClick={() => setPreviewSettings(prev => ({ ...prev, titleBarColor: color }))}
                                  title={color}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              value={previewSettings.titleBarColor}
                              onChange={event => setPreviewSettings(prev => ({ ...prev, titleBarColor: event.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="title-style-grid">
                          {TITLE_STYLE_OPTIONS.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              className={`title-style-card${previewSettings.titleStyle === option.value ? ' active' : ''}`}
                              onClick={() => setPreviewSettings(prev => ({ ...prev, titleStyle: option.value }))}
                            >
                              <span className={`title-style-preview ${option.value}`}>
                                <span className="sample-title">项目经验</span>
                                <span className="sample-line" />
                              </span>
                              <span className="title-style-name">{option.label}</span>
                              <span className="title-style-desc">{option.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resume */}
              <div ref={resumeRef}>
                <ResumePreview
                  data={resumeData}
                  settings={previewSettings}
                  activeModule={activeModule}
                  onModuleHover={handleModuleHover}
                  onModuleClick={handleModuleClick}
                  onPageCountChange={setPreviewPageCount}
                />
              </div>
            </div>

            <ModuleManagerPanel
              data={resumeData}
              onChange={setResumeData}
              activeModuleId={activeModule}
              onSelectModule={setActiveModule}
            />
          </div>
        </div>
      </div>

      <input
        ref={schemaInputRef}
        type="file"
        accept=".md,.markdown,text/markdown,.json,application/json"
        className="visually-hidden-input"
        onChange={handleImportSchema}
      />
    </div>
  )
}

export default App
