export interface ResumeData {
  modules: ResumeModule[]
  basicInfo: {
    name: string
    phone: string
    email: string
    age: string
    gender: string
    maritalStatus: string
    currentStatus: string
    targetCity: string
    expectedPosition: string
    salaryMin: string
    salaryMax: string
    personalWebsite: string
    wechat: string
    linkedin: string
    height: string
    weight: string
    ethnicity: string
    nativePlace: string
    zodiac: string
    mbti: string
    politicalStatus: string
  }
  education: EducationItem[]
  workExperience: WorkItem[]
  projectExperience: WorkItem[]
  clubExperience: WorkItem[]
  personalSummary: string
}

export type BuiltInResumeModuleType = 'basicInfo' | 'education' | 'workExperience' | 'projectExperience' | 'clubExperience' | 'personalSummary'
export type ResumeModuleType = BuiltInResumeModuleType | 'custom'

interface ResumeModuleBase {
  id: string
  type: ResumeModuleType
  title: string
}

export interface BuiltInResumeModule extends ResumeModuleBase {
  type: BuiltInResumeModuleType
}

export interface CustomResumeModule extends ResumeModuleBase {
  type: 'custom'
  content: string
}

export type ResumeModule = BuiltInResumeModule | CustomResumeModule

export const DEFAULT_MODULE_TITLES: Record<BuiltInResumeModuleType, string> = {
  basicInfo: '基本信息',
  education: '教育经历',
  workExperience: '工作经历',
  projectExperience: '项目经历',
  clubExperience: '社团和组织经历',
  personalSummary: '个人总结',
}

export interface EducationItem {
  school: string
  major: string
  degree: string
  department: string
  studyType: string
  startDate: string
  endDate: string
  city: string
  description: string
}

export interface WorkItem {
  company: string
  position: string
  department: string
  startDate: string
  endDate: string
  isCurrent: boolean
  city: string
  description: string
}

export const resumeData: ResumeData = {
  modules: [
    { id: 'basicInfo', type: 'basicInfo', title: DEFAULT_MODULE_TITLES.basicInfo },
    { id: 'personalSummary', type: 'personalSummary', title: DEFAULT_MODULE_TITLES.personalSummary },
    { id: 'workExperience', type: 'workExperience', title: DEFAULT_MODULE_TITLES.workExperience },
    { id: 'projectExperience', type: 'projectExperience', title: DEFAULT_MODULE_TITLES.projectExperience },
    { id: 'clubExperience', type: 'clubExperience', title: DEFAULT_MODULE_TITLES.clubExperience },
    {
      id: 'honors',
      type: 'custom',
      title: '荣誉奖项',
      content: '- 校级优秀学生干部\n- 国家励志奖学金',
    },
    {
      id: 'other',
      type: 'custom',
      title: '其他',
      content: '- **技能**：Office（熟练）、Photoshop（熟练）、Python（了解）',
    },
  ],
  basicInfo: {
    name: '陈媛媛Abbey',
    phone: '188-8888-8888',
    email: 'abbey@wondercv.com',
    age: '26',
    gender: '女',
    maritalStatus: '未婚',
    currentStatus: '',
    targetCity: '杭州',
    expectedPosition: '',
    salaryMin: '',
    salaryMax: '',
    personalWebsite: '',
    wechat: '',
    linkedin: '',
    height: '',
    weight: '',
    ethnicity: '',
    nativePlace: '',
    zodiac: '',
    mbti: '',
    politicalStatus: '',
  },
  education: [],
  workExperience: [
    {
      company: '超级公司',
      position: '实习生',
      department: '市场部',
      startDate: '2025年01月',
      endDate: '2025年12月',
      isCurrent: false,
      city: '北京',
      description: `- 协助市场部进行市场调研，收集和整理行业数据，为市场策略的制定提供数据支持。
- 参与线上营销活动的策划和执行，包括活动方案撰写、物料准备、数据跟踪和效果评估。
- 负责社交媒体平台的日常运营，撰写和发布内容，与粉丝互动，提升品牌知名度和影响力。
- 协助组织线下活动，包括场地布置、嘉宾接待、物料分发等，确保活动顺利进行。
- 整理和归档市场部文件，维护客户数据库，为销售团队提供支持。`,
    },
  ],
  projectExperience: [
    {
      company: '校园招聘项目',
      position: '项目助理',
      department: '',
      startDate: '2025年01月',
      endDate: '2025年12月',
      isCurrent: false,
      city: '北京',
      description: `- 协助项目经理进行校园招聘项目的策划和执行，包括招聘宣传、简历筛选、面试安排等。
- 负责与高校就业指导中心联系，组织校园宣讲会，吸引优秀毕业生参与。
- 参与面试环节，协助评估候选人的综合素质和专业能力。
- 整理和分析招聘数据，为招聘策略的优化提供数据支持。
- 协助处理招聘过程中的突发情况，确保招聘工作顺利进行。`,
    },
    {
      company: '社团文化节',
      position: '活动策划',
      department: '',
      startDate: '2025年01月',
      endDate: '2025年12月',
      isCurrent: false,
      city: '北京',
      description: `- 负责社团文化节的整体策划和组织，包括活动主题确定、内容设计、场地布置等。
- 协调各社团之间的合作，确保活动内容丰富多样。
- 负责活动宣传，包括海报设计、线上推广、媒体合作等，吸引更多同学参与。
- 组织志愿者团队，分工协作，确保活动顺利进行。
- 负责活动预算管理，控制成本，提高活动效益。`,
    },
  ],
  clubExperience: [
    {
      company: '学生会',
      position: '宣传部干事',
      department: '宣传部',
      startDate: '2025年01月',
      endDate: '2025年12月',
      isCurrent: false,
      city: '北京',
      description: `- 负责学生会活动的宣传工作，包括海报设计、文案撰写、线上推广等。
- 管理学生会微信公众号，发布活动信息，与学生互动，提升学生会影响力。
- 协助组织校园文化活动，营造积极向上的校园氛围。
- 参与学生会品牌形象建设，提升学生会整体形象。`,
    },
    {
      company: '志愿者协会',
      position: '志愿者',
      department: '项目部',
      startDate: '2025年01月',
      endDate: '2025年12月',
      isCurrent: false,
      city: '北京',
      description: `- 参与社区志愿服务活动，为社区居民提供帮助。
- 组织环保宣传活动，提高居民环保意识。
- 参与敬老院慰问活动，关爱老人，传递温暖。
- 协助组织志愿者培训，提高志愿者服务能力。`,
    },
  ],
  personalSummary: '具备扎实的专业知识和快速学习能力，通过实习和项目实践积累了初步的职场经验，目标是成为一名优秀的专业人才，为企业发展贡献力量。',
}
