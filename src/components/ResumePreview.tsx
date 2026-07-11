import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import type { CustomResumeModule, ResumeData, ResumeModule } from '../data/resumeData'

export type TitleStyleVariant = 'classic' | 'banner' | 'underline' | 'capsule'
export type ProfileStyleVariant = 'classic' | 'centered' | 'card' | 'split'

const A4_PAGE_HEIGHT = 1123
const A4_PAGE_MARGIN_MM = 5
const MM_TO_PX = 96 / 25.4
const A4_PAGE_MARGIN_PX = A4_PAGE_MARGIN_MM * MM_TO_PX
const A4_PAGE_CONTENT_HEIGHT = A4_PAGE_HEIGHT - A4_PAGE_MARGIN_PX

export interface PreviewSettings {
  fontFamily: string
  fontSize: number
  lineHeight: number
  textColor: string
  moduleSpacing: number
  titleStyle: TitleStyleVariant
  profileStyle: ProfileStyleVariant
}

interface ResumePreviewProps {
  data: ResumeData
  settings: PreviewSettings
  activeModule: string | null
  onModuleHover: (moduleId: string | null) => void
  onModuleClick: (moduleId: string) => void
}

function ResumePreview({ data, settings, activeModule, onModuleHover, onModuleClick }: ResumePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewWidth, setPreviewWidth] = useState(794)
  const [contentHeight, setContentHeight] = useState(A4_PAGE_HEIGHT)

  useEffect(() => {
    const element = previewRef.current
    const page = element?.querySelector<HTMLElement>('.main')

    if (!element || !page) {
      return
    }

    const updateSize = () => {
      setPreviewWidth(element.clientWidth || 794)
      setContentHeight(Math.max(A4_PAGE_HEIGHT, page.scrollHeight))
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    observer.observe(page)

    return () => observer.disconnect()
  }, [])

  const previewScale = Math.min(1, Math.max(0.55, previewWidth / 794))
  const pageCount = Math.max(
    1,
    Math.ceil((contentHeight - A4_PAGE_MARGIN_PX) / A4_PAGE_CONTENT_HEIGHT),
  )

  return (
    <div className="resume-preview-frame">
      <div className="resume-preview-status" aria-live="polite">
        <span>真实 A4 分页预览</span>
        <span>共 {pageCount} 页 · 下边距 {A4_PAGE_MARGIN_MM}mm</span>
      </div>
      <div
        ref={previewRef}
        className="resume-main cn a4"
        style={{ height: `${contentHeight * previewScale}px` }}
      >
        <div
          className="scale visible preview-scale"
          style={{ transform: `scale(${previewScale})` }}
        >
          <div id="cv-container" className="is-page-margin">
            <ResumePage
              data={data}
              settings={settings}
              activeModule={activeModule}
              onModuleHover={onModuleHover}
              onModuleClick={onModuleClick}
              pageCount={pageCount}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

type ResumePageProps = ResumePreviewProps & {
  pageCount: number
}

function ResumePage({
  data,
  settings,
  activeModule,
  onModuleHover,
  onModuleClick,
  pageCount,
}: ResumePageProps) {
  const themeColor = settings.textColor
  const pageMargin = A4_PAGE_MARGIN_MM
  const moduleSpacing = settings.moduleSpacing
  const moduleTitleSpacing = Math.max(2, Number((moduleSpacing * 0.7).toFixed(1)))
  const itemSpacing = 3.2
  const scale = settings.fontSize / 12
  const mutedColor = withAlpha(settings.textColor, 0.7)
  const subtleColor = withAlpha(settings.textColor, 0.2)

  return (
    <div
      className="main one-page-container"
      style={{
        fontFamily: settings.fontFamily,
        lineHeight: settings.lineHeight,
        fontSize: `${settings.fontSize}px`,
        color: settings.textColor,
        padding: `${pageMargin}mm`,
      }}
    >
      {/* Background pattern */}
      <img
        src="https://logo.wondercv.com/banners/UES7OiZZuUuVCQ6.png"
        className="cv-pattern"
        alt=""
      />

      <div className="page-break-guides" aria-hidden="true">
        {Array.from({ length: pageCount }, (_, index) => (
          <div
            key={index}
            className="page-break-guide"
            style={{ top: `${(index + 1) * A4_PAGE_HEIGHT - A4_PAGE_MARGIN_PX}px` }}
          >
            <span>第 {index + 1} 页内容结束</span>
          </div>
        ))}
      </div>

      <div className="content main-page-0">
        <div style={{ height: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          <div className="content-scroll" style={{ marginTop: 0, position: 'relative' }}>
            {data.modules.map(module => renderModuleSection({
              module,
              data,
              activeModule,
              onModuleHover,
              onModuleClick,
              themeColor,
              mutedColor,
              subtleColor,
              pageMargin,
              moduleSpacing,
              moduleTitleSpacing,
              itemSpacing,
              scale,
              titleStyle: settings.titleStyle,
              profileStyle: settings.profileStyle,
            }))}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderModuleSection({
  module,
  data,
  activeModule,
  onModuleHover,
  onModuleClick,
  themeColor,
  mutedColor,
  subtleColor,
  pageMargin,
  moduleSpacing,
  moduleTitleSpacing,
  itemSpacing,
  scale,
  titleStyle,
  profileStyle,
}: {
  module: ResumeModule
  data: ResumeData
  activeModule: string | null
  onModuleHover: (moduleId: string | null) => void
  onModuleClick: (moduleId: string) => void
  themeColor: string
  mutedColor: string
  subtleColor: string
  pageMargin: number
  moduleSpacing: number
  moduleTitleSpacing: number
  itemSpacing: number
  scale: number
  titleStyle: TitleStyleVariant
  profileStyle: ProfileStyleVariant
}) {
  if (module.type === 'basicInfo') {
    return (
      <ModuleWrapper
        key={module.id}
        moduleId="basicInfo"
        label={module.title}
        activeModule={activeModule}
        onHover={onModuleHover}
        onClick={onModuleClick}
      >
        <ProfileSection
          data={data}
          themeColor={themeColor}
          mutedColor={mutedColor}
          moduleSpacing={moduleSpacing}
          scale={scale}
          profileStyle={profileStyle}
        />
      </ModuleWrapper>
    )
  }

  if (module.type === 'education') {
    return (
      <SectionBlock
        key={module.type}
        type="edus"
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
      >
        {data.education.map((edu, index) => (
          <ModuleWrapper
            key={index}
            moduleId={`edu-${index}`}
            label={module.title}
            activeModule={activeModule}
            onHover={onModuleHover}
            onClick={onModuleClick}
          >
            <EducationItem
              edu={edu}
              themeColor={themeColor}
              mutedColor={mutedColor}
              bodyColor={settingsTextColor(themeColor)}
              itemSpacing={itemSpacing}
              scale={scale}
            />
          </ModuleWrapper>
        ))}
      </SectionBlock>
    )
  }

  if (module.type === 'workExperience') {
    return (
      <SectionBlock
        key={module.type}
        type="works"
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
      >
        {data.workExperience.map((work, index) => (
          <ModuleWrapper
            key={index}
            moduleId={`work-${index}`}
            label={module.title}
            activeModule={activeModule}
            onHover={onModuleHover}
            onClick={onModuleClick}
          >
            <WorkItem
              work={work}
              themeColor={themeColor}
              mutedColor={mutedColor}
              bodyColor={settingsTextColor(themeColor)}
              itemSpacing={itemSpacing}
              scale={scale}
            />
          </ModuleWrapper>
        ))}
      </SectionBlock>
    )
  }

  if (module.type === 'projectExperience' || module.type === 'clubExperience') {
    const items = module.type === 'projectExperience' ? data.projectExperience : data.clubExperience
    const modulePrefix = module.type === 'projectExperience' ? 'project' : 'club'

    return (
      <SectionBlock
        key={module.type}
        type={module.type}
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
      >
        {items.map((item, index) => (
          <ModuleWrapper
            key={index}
            moduleId={`${modulePrefix}-${index}`}
            label={module.title}
            activeModule={activeModule}
            onHover={onModuleHover}
            onClick={onModuleClick}
          >
            <WorkItem
              work={item}
              themeColor={themeColor}
              mutedColor={mutedColor}
              bodyColor={settingsTextColor(themeColor)}
              itemSpacing={itemSpacing}
              scale={scale}
            />
          </ModuleWrapper>
        ))}
      </SectionBlock>
    )
  }

  if (module.type === 'personalSummary') {
    return (
      <SectionBlock
        key={module.id}
        type="custom-18138362"
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
      >
        <ModuleWrapper
          moduleId="personalSummary"
          label={module.title}
          activeModule={activeModule}
          onHover={onModuleHover}
          onClick={onModuleClick}
        >
          <SummaryItem
            summary={data.personalSummary}
            bodyColor={settingsTextColor(themeColor)}
            itemSpacing={itemSpacing}
          />
        </ModuleWrapper>
      </SectionBlock>
    )
  }

  if (module.type === 'custom') {
    return (
      <SectionBlock
        key={module.id}
        type={module.id}
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
      >
        <ModuleWrapper
          moduleId={module.id}
          label={module.title}
          activeModule={activeModule}
          onHover={onModuleHover}
          onClick={onModuleClick}
        >
          <CustomModuleItem module={module} bodyColor={settingsTextColor(themeColor)} itemSpacing={itemSpacing} />
        </ModuleWrapper>
      </SectionBlock>
    )
  }

  return null
}

function ModuleWrapper({
  moduleId,
  label,
  children,
  activeModule,
  onHover,
  onClick,
}: {
  moduleId: string
  label: string
  children: React.ReactNode
  activeModule: string | null
  onHover: (id: string | null) => void
  onClick: (id: string) => void
}) {
  const isActive = activeModule === moduleId

  return (
    <div
      className={`module-hoverable${isActive ? ' active-editing' : ''}`}
      onMouseEnter={() => onHover(moduleId)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(moduleId)}
    >
      <div className="module-edit-hint">点击编辑 {label}</div>
      {children}
    </div>
  )
}

function ProfileSection({
  data,
  themeColor,
  mutedColor,
  moduleSpacing,
  scale,
  profileStyle,
}: {
  data: ResumeData
  themeColor: string
  mutedColor: string
  moduleSpacing: number
  scale: number
  profileStyle: ProfileStyleVariant
}) {
  return (
    <div
      className={`user no-avatar no-school-logo basic title-module-strip-profile profile-style-${profileStyle}`}
      style={{
        borderColor: profileStyle === 'card' ? withAlpha(themeColor, 0.18) : 'transparent',
        borderLeftColor: profileStyle === 'card' ? themeColor : undefined,
        color: themeColor,
        backgroundColor: profileStyle === 'card' ? withAlpha(themeColor, 0.045) : undefined,
        marginBottom: `${moduleSpacing}mm`,
      }}
    >
      <div className="user-info has-profile">
        <div className="user-name" style={{ fontSize: sizePx(18, scale), fontWeight: 'bold', marginBottom: '4px', color: themeColor }}>
          {data.basicInfo.name}
        </div>

        {/* Contact info */}
        <div className="profile-item" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginBottom: '2px' }}>
          {data.basicInfo.phone && (
            <ProfileField icon="icondianhua2" label="电话：" value={data.basicInfo.phone} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.email && (
            <ProfileField icon="iconyouxiang2" label="邮箱：" value={data.basicInfo.email} themeColor={themeColor} mutedColor={mutedColor} />
          )}
        </div>

        {/* Personal info */}
        <div className="profile-item" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginBottom: '2px' }}>
          {data.basicInfo.age && (
            <ProfileField icon="iconnianling" label="年龄：" value={data.basicInfo.age} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.gender && (
            <ProfileField icon="iconxingbie" label="性别：" value={data.basicInfo.gender} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.maritalStatus && (
            <ProfileField icon="iconhunyinzhuangkuang" label="婚姻状况：" value={data.basicInfo.maritalStatus} themeColor={themeColor} mutedColor={mutedColor} />
          )}
        </div>

        {/* Job seeking info */}
        <div className="profile-item" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginBottom: '2px' }}>
          {data.basicInfo.currentStatus && (
            <ProfileField icon="icondangqiangongzuozhuangtai" label="当前状态：" value={data.basicInfo.currentStatus} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.targetCity && (
            <ProfileField icon="iconxianjuchengshi" label="意向城市：" value={data.basicInfo.targetCity} themeColor={themeColor} mutedColor={mutedColor} />
          )}
        </div>
      </div>

      <div className="user-avatar">{/* no avatar */}</div>
    </div>
  )
}

function ProfileField({ icon, label, value, themeColor, mutedColor }: {
  icon: string
  label: string
  value: string
  themeColor: string
  mutedColor: string
}) {
  return (
    <span style={{ borderColor: themeColor, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      <i className={`attr-icon iconfont ${icon}`} style={{ color: themeColor }}></i>
      <i className="attr-point" style={{ backgroundColor: themeColor, width: '3px', height: '3px', borderRadius: '50%', display: 'inline-block' }}></i>
      <label className="attr-name" style={{ color: mutedColor }}>{label}</label>
      {value}
    </span>
  )
}

function SectionBlock({ type, title, children, themeColor, subtleColor, moduleSpacing, moduleTitleSpacing, scale, titleStyle }: {
  type: string
  title: string
  children: React.ReactNode
  themeColor: string
  subtleColor: string
  moduleSpacing: number
  moduleTitleSpacing: number
  scale: number
  titleStyle: TitleStyleVariant
}) {
  return (
    <div id={type} className="option option-strip option-wrapper-basic" style={{ marginBottom: `${moduleSpacing}mm` }}>
      <div className="module-title-wrapper" style={{ marginBottom: `${moduleTitleSpacing}mm`, backgroundColor: 'unset' }}>
        <StripTitle title={title} themeColor={themeColor} subtleColor={subtleColor} scale={scale} titleStyle={titleStyle} />
      </div>
      <div className="info-content" style={{ flex: '1 1 0%' }}>
        {children}
      </div>
    </div>
  )
}

function StripTitle({
  title,
  themeColor,
  subtleColor,
  scale,
  titleStyle,
}: {
  title: string
  themeColor: string
  subtleColor: string
  scale: number
  titleStyle: TitleStyleVariant
}) {
  if (titleStyle === 'banner') {
    return (
      <div className="strip-title-wrapper banner" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          className="title"
          style={{
            color: '#fff',
            background: themeColor,
            fontSize: sizePx(14, scale),
            fontWeight: 'bold',
            padding: '5px 12px',
            borderRadius: '999px',
            letterSpacing: '1px',
          }}
        >
          {title}
        </span>
        <div className="bg" style={{ background: subtleColor, flex: 1, height: '2px' }}></div>
      </div>
    )
  }

  if (titleStyle === 'underline') {
    return (
      <div className="strip-title-wrapper underline" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
        <span className="title" style={{ color: themeColor, fontSize: sizePx(15, scale), fontWeight: 'bold', letterSpacing: '1px' }}>{title}</span>
        <div className="bg" style={{ background: themeColor, width: sizePx(52, scale), height: '3px', borderRadius: '999px' }}></div>
      </div>
    )
  }

  if (titleStyle === 'capsule') {
    return (
      <div className="strip-title-wrapper capsule" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          className="title"
          style={{
            color: themeColor,
            fontSize: sizePx(14, scale),
            fontWeight: 'bold',
            padding: '5px 12px',
            borderRadius: '10px',
            border: `1px solid ${subtleColor}`,
            background: withAlpha(themeColor, 0.06),
            letterSpacing: '1px',
          }}
        >
          {title}
        </span>
        <div className="bg" style={{ background: subtleColor, flex: 1, height: '1px' }}></div>
      </div>
    )
  }

  return (
    <div className="strip-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="line" style={{ background: themeColor, width: '4px', height: sizePx(14, scale), borderRadius: '1px' }}></div>
      <span className="title" style={{ color: themeColor, fontSize: sizePx(14, scale), fontWeight: 'bold' }}>{title}</span>
      <div className="bg" style={{ background: subtleColor, flex: 1, height: '1px' }}></div>
    </div>
  )
}

function EducationItem({ edu, themeColor, mutedColor, bodyColor, itemSpacing, scale }: {
  edu: ResumeData['education'][0]
  themeColor: string
  mutedColor: string
  bodyColor: string
  itemSpacing: number
  scale: number
}) {
  const descHtml = useMemo(() => {
    if (!edu.description || edu.description.trim() === '') return ''
    return (marked.parse(edu.description, { async: false }) as string) || ''
  }, [edu.description])

  return (
    <div className="section-item-container" style={{ marginBottom: `${itemSpacing}mm` }}>
      <div className="menu-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="left" style={{ fontWeight: 'bold', color: themeColor, fontSize: sizePx(13, scale) }}>
          {edu.school || '学校名称'}
        </div>
        <div className="right" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: mutedColor, fontSize: sizePx(12, scale) }}>
          <span>{edu.startDate}</span>
          <span>-</span>
          <span>{edu.endDate}</span>
        </div>
      </div>

      <div className="menu-title" style={{ display: 'flex', justifyContent: 'space-between', fontSize: sizePx(12, scale), marginTop: '2px' }}>
        <div className="left" style={{ color: themeColor }}>
          {[edu.major, edu.degree, edu.department, edu.studyType].filter(Boolean).join('  ')}
        </div>
        <div className="right" style={{ color: mutedColor }}>
          {edu.city}
        </div>
      </div>

      {descHtml && (
        <div
          className="menu-content md-rendered"
          style={{ marginTop: '4px', color: bodyColor }}
          dangerouslySetInnerHTML={{ __html: descHtml }}
        />
      )}
    </div>
  )
}

function WorkItem({ work, themeColor, mutedColor, bodyColor, itemSpacing, scale }: {
  work: ResumeData['workExperience'][0]
  themeColor: string
  mutedColor: string
  bodyColor: string
  itemSpacing: number
  scale: number
}) {
  const descHtml = useMemo(() => {
    if (!work.description || work.description.trim() === '') return null
    return (marked.parse(work.description, { async: false }) as string) || null
  }, [work.description])

  return (
    <div className="section-item-container" style={{ marginBottom: `${itemSpacing}mm` }}>
      <div className="menu-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="left" style={{ fontWeight: 'bold', color: themeColor, fontSize: sizePx(13, scale) }}>
          {work.company || '公司名称'}
        </div>
        <div className="right" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: mutedColor, fontSize: sizePx(12, scale) }}>
          <span>{work.startDate}</span>
          <span>-</span>
          {work.isCurrent ? <span>至今</span> : <span>{work.endDate}</span>}
        </div>
      </div>

      <div className="menu-title" style={{ display: 'flex', justifyContent: 'space-between', fontSize: sizePx(12, scale), marginTop: '2px' }}>
        <div className="left" style={{ color: themeColor }}>
          {[work.position, work.department].filter(Boolean).join('  ')}
        </div>
        <div className="right" style={{ color: mutedColor }}>
          {work.city}
        </div>
      </div>

      {descHtml && (
        <div
          className="menu-content md-rendered"
          style={{ marginTop: '4px', color: bodyColor }}
          dangerouslySetInnerHTML={{ __html: descHtml }}
        />
      )}
    </div>
  )
}

function SummaryItem({ summary, bodyColor, itemSpacing }: {
  summary: ResumeData['personalSummary']
  bodyColor: string
  itemSpacing: number
}) {
  if (!summary || summary.trim() === '') return null

  const html = useMemo(() => {
    const raw = marked.parse(summary, { async: false }) as string
    return raw
  }, [summary])

  return (
    <div className="section-item-container" style={{ marginBottom: `${itemSpacing}mm` }}>
      <div
        className="menu-content md-rendered"
        style={{ color: bodyColor }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

function CustomModuleItem({ module, bodyColor, itemSpacing }: {
  module: CustomResumeModule
  bodyColor: string
  itemSpacing: number
}) {
  if (!module.content || module.content.trim() === '') return null

  const html = useMemo(() => {
    const raw = marked.parse(module.content, { async: false }) as string
    return raw
  }, [module.content])

  return (
    <div className="section-item-container" style={{ marginBottom: `${itemSpacing}mm` }}>
      <div
        className="menu-content md-rendered"
        style={{ color: bodyColor }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

function sizePx(base: number, scale: number) {
  return `${Math.round(base * scale * 10) / 10}px`
}

function withAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '')
  if (value.length !== 6) return hex

  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function settingsTextColor(color: string) {
  return withAlpha(color, 0.82)
}

export default memo(ResumePreview)
