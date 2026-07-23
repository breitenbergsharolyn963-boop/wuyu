export interface Contact {
  label: string;
  value: string;
  href?: string;
}

export interface EducationItem {
  school: string;
  degree: string;
  period: string;
  detail?: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  location?: string;
  highlights: string[];
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface CoreSkill {
  name: string;
  level: number; // 0-100，用于动画技能条
}

export interface StatItem {
  value: string;
  label: string;
}

export interface ProjectItem {
  name: string;
  role: string;
  period: string;
  description: string;
  tech: string[];
  link?: string;
}

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  avatar: string;
  contacts: Contact[];
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillGroup[];
  coreSkills: CoreSkill[];
  stats: StatItem[];
  projects: ProjectItem[];
}

// 说明：以下为根据本地论文/个人事迹文档提取的真实信息。
// 标注「占位」的字段原文未提供，请替换为你的真实信息。
export const profile: Profile = {
  name: '吴宇',
  title: '化学工程硕士研究生 · 颗粒流仿真方向',
  tagline: '用离散元仿真（DEM）拆解超细粉体的流动机理，让微观接触参数与宏观流态对话。',
  avatar: '/avatar.svg',
  contacts: [
    { label: '邮箱', value: 'wu.yu@example.edu.cn（占位，请替换）', href: 'mailto:wu.yu@example.edu.cn' },
    { label: 'GitHub', value: 'github.com/wuyu（占位）', href: 'https://github.com/' },
    { label: '研究方向', value: '颗粒流离散元仿真（DEM）' },
    { label: '单位', value: '化学工程与制药学院' },
  ],
  education: [
    {
      school: '化学工程与制药学院',
      degree: '化学工程 · 硕士研究生',
      period: '2024 — 至今',
      detail: '师从周燕代子副教授；研究方向为超细粉体离散元仿真、参数标定与全局敏感性分析；获三等学业奖学金。',
    },
    {
      school: '（占位）本科院校',
      degree: '化学工程 · 学士',
      period: '2020 — 2024（占位，请核对）',
      detail: '占位内容，请替换为你的本科院校、专业与起止时间。',
    },
  ],
  experience: [
    {
      company: '化学工程与制药学院 · 颗粒流仿真课题组',
      role: '硕士研究生 / 研究助理',
      period: '2024 — 至今',
      location: '课题组',
      highlights: [
        '基于 Ansys Rocky DEM 建立 30 μm FCC 催化剂颗粒的薄壁转鼓流动模型，系统标定接触力学参数。',
        '引入粗粒化（CGP）方法将 10⁹ 量级的颗粒系统降至可行计算规模，实现高通量「虚拟粉末表征」。',
        '采用 RS-HDMR 全局敏感性分析（Python / SALib）量化滑动摩擦、滚动阻力、粘附刚度等微观参数对宏观流化质量的控制机制。',
        '编写 Rocky 自动化导出与 Polars 多线程后处理脚本，将欧拉力统计 CSV 的导出—重排流程完全流水线化。',
      ],
    },
  ],
  skills: [
    {
      category: '仿真与建模',
      items: ['Ansys Rocky DEM', '离散元法 (DEM)', '粗粒化 (CGP)', '接触力学模型', '参数标定'],
    },
    {
      category: '编程与数据',
      items: ['Python', 'Polars', 'NumPy', 'OpenCV', 'SALib (RS-HDMR)', '自动化脚本'],
    },
    {
      category: '分析方法',
      items: ['全局敏感性分析', '方差分解', '统计与数据处理', '实验设计 (DoE)'],
    },
    {
      category: '其他',
      items: ['粉体工程', 'LaTeX', '学术写作', '文献调研'],
    },
  ],
  coreSkills: [
    { name: 'Ansys Rocky DEM 建模与仿真', level: 92 },
    { name: 'Python 科学计算 (NumPy / Polars)', level: 88 },
    { name: '离散元 / 接触力学参数标定', level: 85 },
    { name: 'RS-HDMR 全局敏感性分析', level: 80 },
    { name: '粗粒化 (CGP) 与高通量后处理', level: 78 },
    { name: '学术写作与数据可视化 (LaTeX)', level: 75 },
  ],
  stats: [
    { value: '30μm', label: '超细粉体建模尺度' },
    { value: '10⁹', label: '颗粒系统降阶规模' },
    { value: '4', label: '接触力学模型整合' },
    { value: '3+', label: '阶段性研究记录' },
  ],
  projects: [
    {
      name: '超细粉体转鼓流动 DEM 模拟与标定',
      role: '独立研究',
      period: '2025 — 2026',
      description:
        '以工业 FCC 催化剂颗粒（30 μm，密度 1560 kg/m³）为对象，在 Ansys Rocky 中建立薄壁旋转滚筒模型，整合 Hertzian / Mindlin-Deresiewicz / 线性粘附 / 滚动阻力四类接触模型，复现超细粉体的高迟滞流动特性。',
      tech: ['Ansys Rocky DEM', 'Python', 'Polars'],
    },
    {
      name: '基于 RS-HDMR 的全局敏感性分析框架',
      role: '方法研究',
      period: '2025 — 2026',
      description:
        '面向 DEM 微观接触参数的高维耦合问题，构建基于随机采样-高维模型表征（RS-HDMR）的敏感性分析流程，以方差分解定量解耦各参数及其交互效应对动态休止角等宏观指标的贡献。',
      tech: ['Python', 'SALib', 'NumPy'],
    },
    {
      name: '粗粒化 (CGP) 高通量数据处理流程',
      role: '工具开发',
      period: '2026',
      description:
        '针对 Rocky 导出的海量欧拉力统计 CSV，开发自动导出 + Polars 多线程列重排的后处理管线，在保证物理信息完整的前提下显著压缩文件体积、统一字段顺序。',
      tech: ['Python', 'Polars', 'OpenCV'],
    },
  ],
};
