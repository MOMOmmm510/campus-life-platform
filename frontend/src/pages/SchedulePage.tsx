import { useState } from 'react'

/* ════════════════════════════════════════
   类型定义
   ════════════════════════════════════════ */
interface Course {
  name: string
  teacher?: string
  location?: string
  weeks: string
  weekStart: number
  weekEnd: number
  weekType?: 'all' | 'odd' | 'even'
}

interface TimeSlot {
  label: string
  mon?: Course
  tue?: Course
  wed?: Course
  thu?: Course
  fri?: Course
}

interface SemesterData {
  label: string
  courses: { name: string; credits: number; type: string }[]
}

/* ════════════════════════════════════════
   当前学期课表数据（大二上 · 生物技术专业）
   ════════════════════════════════════════ */
const weeklySchedule: TimeSlot[] = [
  {
    label: '第一节\n8:00-8:45',
    mon: { name: '生物化学', teacher: '王老师', location: '明德楼603', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    wed: { name: '细胞生物学', teacher: '李老师', location: '明德楼603', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    fri: { name: '线性代数', teacher: '刘老师', location: '明德楼507', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
  },
  {
    label: '第二节\n8:50-9:35',
    mon: { name: '生物化学', teacher: '王老师', location: '明德楼603', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    wed: { name: '细胞生物学', teacher: '李老师', location: '明德楼603', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    fri: { name: '线性代数', teacher: '刘老师', location: '明德楼507', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
  },
  {
    label: '第三节\n9:50-10:35',
    tue: { name: '概率论与数理统计', teacher: '陈老师', location: '明德楼508', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    wed: { name: '大学物理', teacher: '张老师', location: '明德楼507', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    thu: { name: '细胞生物学', teacher: '李老师', location: '明德楼603', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    fri: { name: '概率论与数理统计', teacher: '陈老师', location: '明德楼508', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
  },
  {
    label: '第四节\n10:40-11:25',
    tue: { name: '概率论与数理统计', teacher: '陈老师', location: '明德楼508', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    wed: { name: '大学物理', teacher: '张老师', location: '明德楼507', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    thu: { name: '细胞生物学', teacher: '李老师', location: '明德楼603', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    fri: { name: '概率论与数理统计', teacher: '陈老师', location: '明德楼508', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
  },
  {
    label: '第五节\n11:30-12:15',
    mon: { name: '体育C', location: '操场', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    tue: { name: '大学英语Ⅲ', teacher: '赵老师', location: '明德楼601', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
  },
  {
    label: '第六节\n14:00-14:45',
    mon: { name: '生物化学实验', teacher: '王老师', location: '杨帆楼526', weeks: '2-15周', weekStart: 2, weekEnd: 15 },
    tue: { name: '大学英语Ⅲ', teacher: '赵老师', location: '明德楼601', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    wed: { name: '大学物理实验', teacher: '张老师', location: '明德楼513', weeks: '3-14周', weekStart: 3, weekEnd: 14 },
    thu: { name: '细胞生物学实验', teacher: '李老师', location: '杨帆楼626', weeks: '2-15周', weekStart: 2, weekEnd: 15 },
    fri: { name: '科技写作与文献检索', teacher: '周老师', location: '明德楼602', weeks: '1-8周', weekStart: 1, weekEnd: 8 },
  },
  {
    label: '第七节\n14:50-15:35',
    mon: { name: '生物化学实验', teacher: '王老师', location: '杨帆楼526', weeks: '2-15周', weekStart: 2, weekEnd: 15 },
    tue: { name: '大学英语Ⅲ', teacher: '赵老师', location: '明德楼601', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    wed: { name: '大学物理实验', teacher: '张老师', location: '明德楼513', weeks: '3-14周', weekStart: 3, weekEnd: 14 },
    thu: { name: '细胞生物学实验', teacher: '李老师', location: '杨帆楼626', weeks: '2-15周', weekStart: 2, weekEnd: 15 },
    fri: { name: '科技写作与文献检索', teacher: '周老师', location: '明德楼602', weeks: '1-8周', weekStart: 1, weekEnd: 8 },
  },
  {
    label: '第八节\n15:50-16:35',
    mon: { name: '生物化学实验', teacher: '王老师', location: '杨帆楼526', weeks: '2-15周', weekStart: 2, weekEnd: 15 },
    wed: { name: '大学物理实验', teacher: '张老师', location: '明德楼513', weeks: '3-14周', weekStart: 3, weekEnd: 14 },
    thu: { name: '细胞生物学实验', teacher: '李老师', location: '杨帆楼626', weeks: '2-15周', weekStart: 2, weekEnd: 15 },
  },
  {
    label: '第十节\n19:00-20:35',
    tue: { name: '全校通选课', location: '明德楼526', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
    thu: { name: '全校通选课', location: '明德楼526', weeks: '1-16周', weekStart: 1, weekEnd: 16 },
  },
]

/* ════════════════════════════════════════
   四年课程体系
   ════════════════════════════════════════ */
const semesterData: SemesterData[] = [
  {
    label: '大一上',
    courses: [
      { name: '高等数学Ⅳ-1', credits: 4.5, type: '必修' },
      { name: '无机化学', credits: 4, type: '必修' },
      { name: '无机化学实验', credits: 2, type: '必修' },
      { name: '植物学', credits: 3, type: '必修' },
      { name: '植物学实验', credits: 1.5, type: '必修' },
      { name: '大学生心理健康教育', credits: 2, type: '必修' },
      { name: '军事理论', credits: 2, type: '必修' },
      { name: '体育A', credits: 0.5, type: '必修' },
      { name: '大学英语Ⅰ', credits: 3, type: '必修' },
    ],
  },
  {
    label: '大一下',
    courses: [
      { name: '高等数学Ⅳ-2', credits: 4.5, type: '必修' },
      { name: '有机化学', credits: 4, type: '必修' },
      { name: '有机化学实验', credits: 2, type: '必修' },
      { name: '动物学', credits: 3, type: '必修' },
      { name: '动物学实验', credits: 1.5, type: '必修' },
      { name: '大学物理Ⅲ', credits: 3, type: '必修' },
      { name: '大学物理实验', credits: 1.5, type: '必修' },
      { name: '体育B', credits: 0.5, type: '必修' },
      { name: '大学英语Ⅱ', credits: 4, type: '必修' },
    ],
  },
  {
    label: '大二上',
    courses: [
      { name: '生物化学', credits: 5, type: '必修' },
      { name: '生物化学实验', credits: 1.5, type: '必修' },
      { name: '细胞生物学', credits: 4, type: '必修' },
      { name: '细胞生物学实验', credits: 1, type: '必修' },
      { name: '线性代数', credits: 3, type: '必修' },
      { name: '概率论与数理统计', credits: 3, type: '必修' },
      { name: '大学物理', credits: 3, type: '必修' },
      { name: '大学物理实验', credits: 1.5, type: '必修' },
      { name: '体育C', credits: 1, type: '必修' },
      { name: '大学英语Ⅲ', credits: 4, type: '必修' },
      { name: '科技写作与文献检索', credits: 2, type: '选修' },
    ],
  },
  {
    label: '大二下',
    courses: [
      { name: '遗传学', credits: 3, type: '必修' },
      { name: '遗传学实验', credits: 1.5, type: '必修' },
      { name: '微生物学', credits: 3, type: '必修' },
      { name: '微生物学实验', credits: 1.5, type: '必修' },
      { name: '生物统计附实验设计', credits: 2.5, type: '必修' },
      { name: '体育D', credits: 1, type: '必修' },
      { name: '大学英语Ⅳ', credits: 3, type: '必修' },
      { name: '马原/毛概', credits: 3, type: '必修' },
    ],
  },
  {
    label: '大三上',
    courses: [
      { name: '分子生物学', credits: 3, type: '必修' },
      { name: '基因工程原理', credits: 2.5, type: '必修' },
      { name: '免疫学', credits: 2.5, type: '必修' },
      { name: '发酵工程', credits: 2.5, type: '必修' },
      { name: '生物信息学', credits: 2, type: '必修' },
      { name: '细胞工程', credits: 2.5, type: '选修' },
      { name: '生物技术制药', credits: 2, type: '选修' },
      { name: '生命科学前沿讲座', credits: 1, type: '选修' },
    ],
  },
  {
    label: '大三下',
    courses: [
      { name: '生化分离与分析技术', credits: 3, type: '必修' },
      { name: '生物技术实验', credits: 3, type: '必修' },
      { name: '生物反应器', credits: 1.5, type: '选修' },
      { name: '生物统计学', credits: 2, type: '选修' },
      { name: '生物医学模型', credits: 2, type: '选修' },
      { name: '天然产物化学', credits: 2.5, type: '选修' },
      { name: '药物设计学', credits: 2, type: '选修' },
      { name: '毕业实习', credits: 4, type: '必修' },
    ],
  },
  {
    label: '大四上',
    courses: [
      { name: '文献检索与论文写作', credits: 1.5, type: '选修' },
      { name: '干细胞与转化研究', credits: 2, type: '选修' },
      { name: '生物组学大数据', credits: 2.5, type: '选修' },
      { name: '生物安全', credits: 1.5, type: '选修' },
      { name: '转基因技术及应用', credits: 1.5, type: '选修' },
      { name: '毕业论文（设计）开题', credits: 2, type: '必修' },
    ],
  },
  {
    label: '大四下',
    courses: [
      { name: '毕业论文（设计）', credits: 8, type: '必修' },
      { name: '毕业实习', credits: 4, type: '必修' },
    ],
  },
]

/* ════════════════════════════════════════
   星期映射
   ════════════════════════════════════════ */
const weekDays = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
const dayLabels: Record<string, string> = { mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五' }

/* ════════════════════════════════════════
   颜色方案
   ════════════════════════════════════════ */
const courseColors = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-pink-100 text-pink-800 border-pink-200',
]

function getCourseColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return courseColors[hash % courseColors.length]
}

/* ════════════════════════════════════════
   判断课程是否在当前周
   ════════════════════════════════════════ */
function isCourseInWeek(course: Course, week: number): boolean {
  if (week < course.weekStart || week > course.weekEnd) return false
  if (course.weekType === 'odd') return week % 2 === 1
  if (course.weekType === 'even') return week % 2 === 0
  return true
}

/* ════════════════════════════════════════
   视图切换
   ════════════════════════════════════════ */
type ViewMode = 'weekly' | 'overview'

const TOTAL_WEEKS = 16

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [expandedSemester, setExpandedSemester] = useState<string | null>('大二上')
  const [currentWeek, setCurrentWeek] = useState(1)

  const prevWeek = () => setCurrentWeek((w) => Math.max(1, w - 1))
  const nextWeek = () => setCurrentWeek((w) => Math.min(TOTAL_WEEKS, w + 1))

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold text-blue-900">生物技术专业 · 课程表</h1>

      {/* ── 视图切换 ── */}
      <div className="mb-8 flex gap-2">
        <button
          onClick={() => setViewMode('overview')}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
            viewMode === 'overview'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          📚 四年课程体系
        </button>
        <button
          onClick={() => setViewMode('weekly')}
          className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
            viewMode === 'weekly'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          📅 本学期课表（大二上）
        </button>
      </div>

      {/* ══════════════════════════════════
          视图一：四年课程体系
          ══════════════════════════════════ */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {semesterData.map((sem) => {
            const isExpanded = expandedSemester === sem.label
            const totalCredits = sem.courses.reduce((s, c) => s + c.credits, 0)
            return (
              <div
                key={sem.label}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* 学期标题 */}
                <button
                  onClick={() => setExpandedSemester(isExpanded ? null : sem.label)}
                  className="flex w-full items-center justify-between bg-gradient-to-r from-blue-50 to-white px-5 py-3 text-left"
                >
                  <div>
                    <h3 className="text-base font-bold text-blue-900">{sem.label}</h3>
                    <p className="text-xs text-gray-400">{totalCredits.toFixed(1)} 学分</p>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* 课程列表 */}
                {isExpanded && (
                  <div className="divide-y divide-gray-50 px-5 py-3">
                    {sem.courses.map((course, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              course.type === '必修'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {course.type}
                          </span>
                          <span className="text-sm text-gray-800">{course.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{course.credits}学分</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════
          视图二：本学期课表（大二上）
          ══════════════════════════════════ */}
      {viewMode === 'weekly' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* ── 学期与周次导航 ── */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium text-gray-700">当前学期：</span>
              <span className="rounded bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-800">
                大二上学期
              </span>
            </div>

            {/* 周次切换 */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevWeek}
                disabled={currentWeek <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className="min-w-[5rem] text-center text-sm font-semibold text-gray-700">
                第 {currentWeek} 周
              </span>
              <button
                onClick={nextWeek}
                disabled={currentWeek >= TOTAL_WEEKS}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>

          <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
            {/* ── 表头 ── */}
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-20 border-b border-r border-gray-200 bg-gray-50 px-2 py-3 text-xs font-semibold text-gray-500">
                  节次/星期
                </th>
                {weekDays.map((d) => (
                  <th
                    key={d}
                    className="border-b border-r border-gray-200 bg-gray-50 px-2 py-3 text-center text-sm font-semibold text-gray-700"
                  >
                    {dayLabels[d]}
                  </th>
                ))}
              </tr>
            </thead>

            {/* ── 行 ── */}
            <tbody>
              {weeklySchedule.map((slot, rowIdx) => (
                <tr key={rowIdx} className="group">
                  {/* 时间列 */}
                  <td className="sticky left-0 z-10 border-b border-r border-gray-200 bg-gray-50 px-2 py-2.5 text-center text-[11px] leading-tight text-gray-500">
                    {slot.label.split('\n').map((line, i) => (
                      <span key={i}>
                        {i > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </td>

                  {/* 课程格子 */}
                  {weekDays.map((day) => {
                    const course = slot[day]
                    const isActive = course && isCourseInWeek(course, currentWeek)
                    return (
                      <td
                        key={day}
                        className={`border-b border-r border-gray-100 px-1 py-1 align-top ${
                          isActive ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        {isActive && course ? (
                          <div
                            className={`rounded-md border px-2 py-1.5 text-xs leading-snug ${getCourseColor(course.name)}`}
                          >
                            <div className="mb-0.5 font-semibold">{course.name}</div>
                            {course.teacher && (
                              <div className="text-[10px] opacity-75">{course.teacher}</div>
                            )}
                            {course.location && (
                              <div className="text-[10px] opacity-60">{course.location}</div>
                            )}
                            {course.weeks && (
                              <div className="mt-0.5 text-[9px] opacity-50">{course.weeks}</div>
                            )}
                          </div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── 底部信息 ── */}
          <div className="border-t border-gray-100 px-5 py-3">
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span>📘 带实验的课程含实验学时</span>
              <span>🧪 化学实验位于杨帆楼526 · 生物实验位于杨帆楼626</span>
              <span>🏫 理论课位于明德楼</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
