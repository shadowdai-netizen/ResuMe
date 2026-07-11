import { useRef, useState, useCallback, useEffect } from 'react'
import './App.css'
import ResumePreview, { type PreviewSettings, type ProfileStyleVariant, type TitleStyleVariant } from './components/ResumePreview'
import EditorPanel from './components/EditorPanel'
import ModuleManagerPanel from './components/ModuleManagerPanel'
import { resumeData as defaultData } from './data/resumeData'
import type { ResumeData } from './data/resumeData'
import { getDefaultActiveModuleId, isActiveModuleIdValid } from './utils/moduleSelection'
import { createResumeSchemaFile, parseResumeSchemaJson } from './utils/resumeSchema'

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
  { value: 'capsule', label: '圆角徽标', description: '更柔和，也更有个性' },
]

const PROFILE_STYLE_OPTIONS: Array<{ value: ProfileStyleVariant; label: string; description: string }> = [
  { value: 'classic', label: '经典横排', description: '信息清晰，适合大多数简历' },
  { value: 'centered', label: '居中名片', description: '更轻盈，突出姓名与联系方式' },
  { value: 'card', label: '强调卡片', description: '增加层次，适合个性化简历' },
  { value: 'split', label: '左右分栏', description: '姓名与资料分区展示' },
]

const COLOR_PRESETS = ['#111827', '#1f3a5f', '#14532d', '#7c2d12', '#4c1d95']

function App() {
  const resumeRef = useRef<HTMLDivElement>(null)
  const schemaInputRef = useRef<HTMLInputElement>(null)
  const [resumeData, setResumeData] = useState<ResumeData>(defaultData)
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [activePreviewTab, setActivePreviewTab] = useState<'typography' | 'titles'>('typography')
  const [schemaFeedback, setSchemaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>({
    fontFamily: FONT_OPTIONS[0].value,
    fontSize: 12,
    lineHeight: 1.75,
    textColor: '#111827',
    moduleSpacing: 5,
    titleStyle: 'classic',
    profileStyle: 'classic',
  })

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

  const handleExportSchema = useCallback(() => {
    const schemaFile = createResumeSchemaFile(resumeData)
    const blob = new Blob([JSON.stringify(schemaFile, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStamp = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `resume-schema-${dateStamp}.json`
    link.click()
    window.URL.revokeObjectURL(url)

    setSchemaFeedback({ type: 'success', message: '已导出 JSON schema 文件。' })
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
      const jsonText = await file.text()
      const importedData = parseResumeSchemaJson(jsonText)
      setResumeData(importedData)
      setSchemaFeedback({ type: 'success', message: `已导入 ${file.name}。` })
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入失败，请检查 JSON 内容。'
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
                      onClick={handleImportButtonClick}
                    >
                      导入 JSON
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn secondary"
                      onClick={handleExportSchema}
                    >
                      导出 JSON
                    </button>
                    <button
                      type="button"
                      className="toolbar-btn primary"
                      onClick={handleExportPDF}
                    >
                      下载 PDF
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
                        <span className="style-picker-label">大模块标题样式</span>
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
        accept=".json,application/json"
        className="visually-hidden-input"
        onChange={handleImportSchema}
      />
    </div>
  )
}

export default App
