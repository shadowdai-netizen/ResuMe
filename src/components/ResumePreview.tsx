import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import type { CustomResumeModule, ResumeData, ResumeModule } from '../data/resumeData'

export type TitleStyleVariant = 'classic' | 'banner' | 'underline' | 'capsule'
export type ProfileStyleVariant = 'classic' | 'centered' | 'card' | 'split'

const A4_PAGE_HEIGHT = 1123
const A4_PAGE_MARGIN_MM = 5
const MM_TO_PX = 96 / 25.4
const A4_PAGE_MARGIN_PX = A4_PAGE_MARGIN_MM * MM_TO_PX
const A4_PAGE_CONTENT_HEIGHT = A4_PAGE_HEIGHT - A4_PAGE_MARGIN_PX * 2

export interface PreviewSettings {
  fontFamily: string
  fontSize: number
  lineHeight: number
  textColor: string
  moduleSpacing: number
  titleStyle: TitleStyleVariant
  profileStyle: ProfileStyleVariant
  onePageMode: boolean
  titleBarColor: string
}

interface ResumePreviewProps {
  data: ResumeData
  settings: PreviewSettings
  activeModule: string | null
  onModuleHover: (moduleId: string | null) => void
  onModuleClick: (moduleId: string) => void
  onPageCountChange?: (pageCount: number) => void
}

function ResumePreview({ data, settings, activeModule, onModuleHover, onModuleClick, onPageCountChange }: ResumePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewWidth, setPreviewWidth] = useState(794)
  const moduleIds = useMemo(() => data.modules.map(module => module.id), [data.modules])
  const [pageGroups, setPageGroups] = useState<string[][]>(() => [moduleIds])

  useEffect(() => {
    setPageGroups([moduleIds])
  }, [moduleIds])

  useEffect(() => {
    const element = previewRef.current

    if (!element) {
      return
    }

    const updateSize = () => {
      setPreviewWidth(element.clientWidth || 794)

      const pageContent = element.querySelector<HTMLElement>('.a4-page-content')
      const moduleElements = Array.from(element.querySelectorAll<HTMLElement>('[data-resume-module]'))

      if (!pageContent || moduleElements.length === 0) {
        return
      }

      const availableHeight = pageContent.clientHeight || A4_PAGE_CONTENT_HEIGHT
      const nextPages: string[][] = []
      let currentPage: string[] = []
      let usedHeight = 0
      let previousMargin = 0

      for (const moduleElement of moduleElements) {
        const moduleId = moduleElement.dataset.resumeModule
        if (!moduleId) {
          continue
        }

        const moduleHeight = moduleElement.offsetHeight
        const moduleMargin = parseFloat(getComputedStyle(moduleElement).marginBottom) || 0
        const nextHeight = currentPage.length === 0
          ? moduleHeight
          : usedHeight + previousMargin + moduleHeight

        if (currentPage.length > 0 && nextHeight > availableHeight) {
          nextPages.push(currentPage)
          currentPage = []
          usedHeight = 0
          previousMargin = 0
        }

        currentPage.push(moduleId)
        usedHeight += currentPage.length === 1 ? moduleHeight : previousMargin + moduleHeight
        previousMargin = moduleMargin
      }

      if (currentPage.length > 0) {
        nextPages.push(currentPage)
      }

      if (!pageGroupsEqual(pageGroups, nextPages)) {
        setPageGroups(nextPages.length > 0 ? nextPages : [moduleIds])
      }
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    element.querySelectorAll<HTMLElement>('[data-resume-module], .a4-page-content').forEach(node => observer.observe(node))

    return () => observer.disconnect()
  }, [moduleIds, pageGroups])

  const previewScale = Math.min(1, Math.max(0.55, previewWidth / 794))
  const pageCount = Math.max(1, pageGroups.length)
  const contentHeight = pageCount * A4_PAGE_HEIGHT

  useEffect(() => {
    onPageCountChange?.(pageCount)
  }, [onPageCountChange, pageCount])

  return (
    <div className="resume-preview-frame">
      <div className="resume-preview-status" aria-live="polite">
        <span>真实 A4 分页预览</span>
        <span>共 {pageCount} 页 · 上下边距 {A4_PAGE_MARGIN_MM}mm</span>
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
              pageGroups={pageGroups}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

type ResumePageProps = ResumePreviewProps & {
  pageGroups: string[][]
}

function ResumePage({
  data,
  settings,
  activeModule,
  onModuleHover,
  onModuleClick,
  pageGroups,
}: ResumePageProps) {
  const themeColor = settings.textColor
  const moduleSpacing = settings.onePageMode
    ? Math.max(1.5, Number((settings.moduleSpacing * 0.48).toFixed(1)))
    : settings.moduleSpacing
  const moduleTitleSpacing = settings.onePageMode
    ? Math.max(1, Number((moduleSpacing * 0.55).toFixed(1)))
    : Math.max(2, Number((moduleSpacing * 0.7).toFixed(1)))
  const itemSpacing = settings.onePageMode ? 1.6 : 3.2
  const scale = settings.fontSize / 12
  const lineHeight = settings.onePageMode
    ? Math.max(1.3, Number((settings.lineHeight * 0.86).toFixed(2)))
    : settings.lineHeight
  const mutedColor = withAlpha(settings.textColor, 0.7)
  const subtleColor = withAlpha(settings.textColor, 0.2)

  return (
    <div
      className="main one-page-container"
      style={{
        fontFamily: settings.fontFamily,
        lineHeight,
        fontSize: `${settings.fontSize}px`,
        color: settings.textColor,
        padding: 0,
      }}
    >
      {/* Background pattern */}
      <img
        src="https://logo.wondercv.com/banners/UES7OiZZuUuVCQ6.png"
        className="cv-pattern"
        alt=""
      />

      {pageGroups.map((pageModuleIds, pageIndex) => {
        const modulesById = new Map(data.modules.map(module => [module.id, module]))

        return (
          <div className={`a4-page-sheet${pageIndex === pageGroups.length - 1 ? ' last' : ''}`} key={`page-${pageIndex}`}>
            <div className="a4-page-margin-placeholder top">
              <span>顶部边距 {A4_PAGE_MARGIN_MM}mm</span>
            </div>
            <div
              className="content a4-page-content"
              style={{ padding: '0 40px' }}
            >
              <div style={{ height: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <div className="content-scroll" style={{ marginTop: 0, position: 'relative' }}>
                  {pageModuleIds.map(moduleId => {
                    const module = modulesById.get(moduleId)
                    if (!module) return null

                    return renderModuleSection({
                      module,
                      data,
                      activeModule,
                      onModuleHover,
                      onModuleClick,
                      themeColor,
                      mutedColor,
                      subtleColor,
                      moduleSpacing,
                      moduleTitleSpacing,
                      itemSpacing,
                      scale,
                      titleStyle: settings.titleStyle,
                      profileStyle: settings.profileStyle,
                      titleBarColor: settings.titleBarColor,
                    })
                  })}
                </div>
              </div>
            </div>
            <div className="a4-page-margin-placeholder bottom">
              <span>底部边距 {A4_PAGE_MARGIN_MM}mm</span>
            </div>
          </div>
        )
      })}
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
  moduleSpacing,
  moduleTitleSpacing,
  itemSpacing,
  scale,
  titleStyle,
  profileStyle,
  titleBarColor,
}: {
  module: ResumeModule
  data: ResumeData
  activeModule: string | null
  onModuleHover: (moduleId: string | null) => void
  onModuleClick: (moduleId: string) => void
  themeColor: string
  mutedColor: string
  subtleColor: string
  moduleSpacing: number
  moduleTitleSpacing: number
  itemSpacing: number
  scale: number
  titleStyle: TitleStyleVariant
  profileStyle: ProfileStyleVariant
  titleBarColor: string
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
        moduleBlock
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
        moduleId={module.id}
        type="edus"
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
        titleBarColor={titleBarColor}
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
        moduleId={module.id}
        type="works"
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
        titleBarColor={titleBarColor}
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
        moduleId={module.id}
        type={module.type}
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
        titleBarColor={titleBarColor}
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
        moduleId={module.id}
        type="custom-18138362"
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
        titleBarColor={titleBarColor}
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
        moduleId={module.id}
        type={module.id}
        title={module.title}
        themeColor={themeColor}
        subtleColor={subtleColor}
        moduleSpacing={moduleSpacing}
        moduleTitleSpacing={moduleTitleSpacing}
        scale={scale}
        titleStyle={titleStyle}
        titleBarColor={titleBarColor}
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
  moduleBlock = false,
}: {
  moduleId: string
  label: string
  children: React.ReactNode
  activeModule: string | null
  onHover: (id: string | null) => void
  onClick: (id: string) => void
  moduleBlock?: boolean
}) {
  const isActive = activeModule === moduleId

  return (
    <div
      className={`module-hoverable${moduleBlock ? ' resume-module-block' : ''}${isActive ? ' active-editing' : ''}`}
      data-resume-module={moduleBlock ? moduleId : undefined}
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
          {data.basicInfo.politicalStatus && (
            <ProfileField label="政治面貌：" value={data.basicInfo.politicalStatus} themeColor={themeColor} mutedColor={mutedColor} />
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
          {data.basicInfo.expectedPosition && (
            <ProfileField label="期望职位：" value={data.basicInfo.expectedPosition} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {(data.basicInfo.salaryMin || data.basicInfo.salaryMax) && (
            <ProfileField
              label="期望薪资："
              value={formatSalaryRange(data.basicInfo.salaryMin, data.basicInfo.salaryMax)}
              themeColor={themeColor}
              mutedColor={mutedColor}
            />
          )}
        </div>

        {/* Social information */}
        <div className="profile-item" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginBottom: '2px' }}>
          {data.basicInfo.personalWebsite && (
            <ProfileField label="个人网站：" value={data.basicInfo.personalWebsite} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.wechat && (
            <ProfileField label="微信：" value={data.basicInfo.wechat} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.linkedin && (
            <ProfileField label="LinkedIn：" value={data.basicInfo.linkedin} themeColor={themeColor} mutedColor={mutedColor} />
          )}
        </div>

        {/* Other information */}
        <div className="profile-item" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginBottom: '2px' }}>
          {data.basicInfo.height && (
            <ProfileField label="身高：" value={data.basicInfo.height} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.weight && (
            <ProfileField label="体重：" value={data.basicInfo.weight} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.ethnicity && (
            <ProfileField label="民族：" value={data.basicInfo.ethnicity} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.nativePlace && (
            <ProfileField label="籍贯：" value={data.basicInfo.nativePlace} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.zodiac && (
            <ProfileField label="星座：" value={data.basicInfo.zodiac} themeColor={themeColor} mutedColor={mutedColor} />
          )}
          {data.basicInfo.mbti && (
            <ProfileField label="MBTI：" value={data.basicInfo.mbti} themeColor={themeColor} mutedColor={mutedColor} />
          )}
        </div>
      </div>

      <div className="user-avatar">{/* no avatar */}</div>
    </div>
  )
}

function ProfileField({ icon, label, value, themeColor, mutedColor }: {
  icon?: string
  label: string
  value: string
  themeColor: string
  mutedColor: string
}) {
  return (
    <span style={{ borderColor: themeColor, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {icon ? <i className={`attr-icon iconfont ${icon}`} style={{ color: themeColor }}></i> : null}
      <i className="attr-point" style={{ backgroundColor: themeColor, width: '3px', height: '3px', borderRadius: '50%', display: 'inline-block' }}></i>
      <label className="attr-name" style={{ color: mutedColor }}>{label}</label>
      {value}
    </span>
  )
}

function formatSalaryRange(min: string, max: string) {
  if (min && max) return `${min} - ${max}`
  if (min) return `${min}起`
  return `${max}以内`
}

function SectionBlock({ moduleId, type, title, children, themeColor, subtleColor, moduleSpacing, moduleTitleSpacing, scale, titleStyle, titleBarColor }: {
  moduleId: string
  type: string
  title: string
  children: React.ReactNode
  themeColor: string
  subtleColor: string
  moduleSpacing: number
  moduleTitleSpacing: number
  scale: number
  titleStyle: TitleStyleVariant
  titleBarColor: string
}) {
  return (
    <div
      id={type}
      className="option option-strip option-wrapper-basic resume-module-block"
      data-resume-module={moduleId}
      style={{ marginBottom: `${moduleSpacing}mm` }}
    >
      <div className="module-title-wrapper" style={{ marginBottom: `${moduleTitleSpacing}mm`, backgroundColor: 'unset' }}>
        <StripTitle title={title} themeColor={themeColor} subtleColor={subtleColor} scale={scale} titleStyle={titleStyle} titleBarColor={titleBarColor} />
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
  titleBarColor,
}: {
  title: string
  themeColor: string
  subtleColor: string
  scale: number
  titleStyle: TitleStyleVariant
  titleBarColor: string
}) {
  if (titleStyle === 'banner') {
    return (
      <div className="strip-title-wrapper banner" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          className="title"
          style={{
            color: '#fff',
            background: titleBarColor,
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
      <div
        className="strip-title-wrapper capsule"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '5px 12px',
          borderRadius: 0,
          background: titleBarColor,
        }}
      >
        <span
          className="title"
          style={{
            color: '#fff',
            fontSize: sizePx(14, scale),
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}
        >
          {title}
        </span>
      </div>
    )
  }

  return (
    <div className="strip-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="line" style={{ background: titleBarColor, width: '4px', height: sizePx(14, scale), borderRadius: '1px' }}></div>
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

function pageGroupsEqual(left: string[][], right: string[][]) {
  if (left.length !== right.length) return false

  return left.every((page, pageIndex) => (
    page.length === right[pageIndex].length
    && page.every((moduleId, moduleIndex) => moduleId === right[pageIndex][moduleIndex])
  ))
}

export default memo(ResumePreview)
