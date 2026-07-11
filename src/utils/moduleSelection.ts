import type { ResumeData, ResumeModule } from '../data/resumeData'

export function getModuleSelectionId(data: ResumeData, module: ResumeModule) {
  if (module.type === 'education') {
    return data.education.length > 0 ? 'edu-0' : 'education'
  }

  if (module.type === 'workExperience') {
    return data.workExperience.length > 0 ? 'work-0' : 'workExperience'
  }

  if (module.type === 'projectExperience') {
    return data.projectExperience.length > 0 ? 'project-0' : 'projectExperience'
  }

  if (module.type === 'clubExperience') {
    return data.clubExperience.length > 0 ? 'club-0' : 'clubExperience'
  }

  return module.id
}

export function getDefaultActiveModuleId(data: ResumeData) {
  const firstModule = data.modules[0]
  return firstModule ? getModuleSelectionId(data, firstModule) : null
}

export function isActiveModuleIdValid(data: ResumeData, activeModuleId: string | null) {
  if (!activeModuleId) {
    return false
  }

  if (activeModuleId === 'education') {
    return data.modules.some(module => module.type === 'education')
  }

  if (activeModuleId === 'workExperience') {
    return data.modules.some(module => module.type === 'workExperience')
  }

  if (activeModuleId === 'projectExperience') {
    return data.modules.some(module => module.type === 'projectExperience')
  }

  if (activeModuleId === 'clubExperience') {
    return data.modules.some(module => module.type === 'clubExperience')
  }

  const educationMatch = activeModuleId.match(/^edu-(\d+)$/)
  if (educationMatch) {
    const index = Number(educationMatch[1])
    return data.modules.some(module => module.type === 'education') && index >= 0 && index < data.education.length
  }

  const workMatch = activeModuleId.match(/^work-(\d+)$/)
  if (workMatch) {
    const index = Number(workMatch[1])
    return data.modules.some(module => module.type === 'workExperience') && index >= 0 && index < data.workExperience.length
  }

  const projectMatch = activeModuleId.match(/^project-(\d+)$/)
  if (projectMatch) {
    const index = Number(projectMatch[1])
    return data.modules.some(module => module.type === 'projectExperience') && index >= 0 && index < data.projectExperience.length
  }

  const clubMatch = activeModuleId.match(/^club-(\d+)$/)
  if (clubMatch) {
    const index = Number(clubMatch[1])
    return data.modules.some(module => module.type === 'clubExperience') && index >= 0 && index < data.clubExperience.length
  }

  return data.modules.some(module => module.id === activeModuleId)
}

export function getIndexedModulePosition(activeModuleId: string | null, prefix: 'edu' | 'work' | 'project' | 'club') {
  if (!activeModuleId) {
    return null
  }

  const match = activeModuleId.match(new RegExp(`^${prefix}-(\\d+)$`))
  if (!match) {
    return null
  }

  return Number(match[1])
}
