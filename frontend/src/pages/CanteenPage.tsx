import { useState, useEffect, useCallback } from 'react'
import RatingStars from '../components/RatingStars.tsx'
import ReviewForm from '../components/ReviewForm.tsx'
import { apiRequest } from '../config/api.ts'

interface Canteen {
  id: number
  name: string
  location: string
  rating: number
  tags: string[]
  image?: string
}

interface Review {
  id: number
  canteenId: number
  username: string
  content: string
  rating: number
  time: string
}

const categories = ['全部', '第一食堂', '第二食堂', '第三食堂', '教工食堂']

/* ── Toast 组件 ── */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <div className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-2xl pointer-events-auto">
        <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        {message}
      </div>
    </div>
  )
}

export default function CanteenPage() {
  const [canteens, setCanteens] = useState<Canteen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [reviewMap, setReviewMap] = useState<Record<number, Review[]>>({})
  const [aiSummaryMap, setAiSummaryMap] = useState<Record<number, string>>({})
  const [loadingAiMap, setLoadingAiMap] = useState<Record<number, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  const fetchCanteens = async () => {
    setLoading(true)
    setError(false)
    try {
      const json = await apiRequest('/api/canteens')
      const data: Canteen[] = json.data
      setCanteens(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCanteens()
  }, [])

  const filtered = canteens.filter((canteen) => {
    const matchSearch =
      searchText === '' ||
      canteen.name.includes(searchText) ||
      canteen.location.includes(searchText)

    const matchCategory =
      activeCategory === '全部' || canteen.name === activeCategory

    return matchSearch && matchCategory
  })

  const fetchReviews = async (canteenId: number) => {
    try {
      const json = await apiRequest(`/api/reviews?canteen_id=${canteenId}`)
      const backendReviews = json.data.reviews || []
      const mapped: Review[] = backendReviews.map((r: Record<string, unknown>) => ({
        id: r.id as number,
        canteenId: r.canteen_id as number,
        username: (r.username as string) || '用户',
        content: r.content as string,
        rating: r.rating as number,
        time: (r.created_at as string).replace('T', ' ').slice(0, 16),
      }))
      setReviewMap((prev) => ({ ...prev, [canteenId]: mapped }))
    } catch {
      // Silently fail — reviews are non-critical
    }
  }

  const fetchAiSummary = async (canteenId: number) => {
    /* ── 未登录提示 ── */
    const token = localStorage.getItem('token')
    if (!token) {
      setToast('请先登录')
      return
    }

    /* ── 已有缓存直接返回 ── */
    if (aiSummaryMap[canteenId]) return

    setLoadingAiMap((prev) => ({ ...prev, [canteenId]: true }))
    try {
      const json = await apiRequest('/api/ai/summarize-reviews', 'POST', { canteen_id: canteenId })
      setAiSummaryMap((prev) => ({ ...prev, [canteenId]: json.data.summary }))
    } catch {
      setToast('AI总结失败，请稍后重试')
    } finally {
      setLoadingAiMap((prev) => ({ ...prev, [canteenId]: false }))
    }
  }

  const toggleExpand = (id: number) => {
    const next = expandedId === id ? null : id
    setExpandedId(next)
    if (next !== null && !reviewMap[next]) {
      fetchReviews(next)
    }
  }

  const canteenReviews = expandedId ? reviewMap[expandedId] || [] : []

  const handleReviewSuccess = useCallback(() => {
    if (expandedId) {
      fetchReviews(expandedId)
    }
  }, [expandedId])

  const handleCloseToast = useCallback(() => setToast(null), [])

  /* ── Skeleton loading ── */
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="h-40 w-full bg-gray-200" />
          <div className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="h-5 w-24 rounded bg-gray-200" />
              <div className="h-4 w-18 rounded bg-gray-200" />
            </div>
            <div className="mb-3 h-4 w-32 rounded bg-gray-200" />
            <div className="flex flex-wrap gap-1.5">
              <div className="h-5 w-14 rounded-full bg-gray-200" />
              <div className="h-5 w-14 rounded-full bg-gray-200" />
              <div className="h-5 w-14 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  /* ── Error state ── */
  const renderError = () => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-20">
      <svg
        className="mb-4 h-14 w-14 text-red-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" strokeLinecap="round" />
        <path d="M12 16h.01" strokeLinecap="round" />
      </svg>
      <p className="mb-5 text-sm text-red-600">加载失败，请检查网络连接</p>
      <button
        onClick={fetchCanteens}
        className="rounded-lg bg-red-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-600"
      >
        重新加载
      </button>
    </div>
  )

  /* ── Empty image fallback ── */
  const renderCanteenImage = (canteen: Canteen) => {
    if (canteen.image) {
      return (
        <img
          src={canteen.image}
          alt={canteen.name}
          className="h-40 w-full object-cover"
        />
      )
    }
    return (
      <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900">
        <span className="text-2xl font-bold text-white/80">{canteen.name}</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {toast && <Toast message={toast} onClose={handleCloseToast} />}

      <h1 className="mb-6 text-3xl font-bold text-blue-900">食堂点评</h1>

      {/* Search input */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="搜索食堂名称或位置"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {/* Category tags */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              activeCategory === cat
                ? 'bg-blue-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && renderSkeleton()}

      {/* Error */}
      {!loading && error && renderError()}

      {/* Success */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-gray-400">没有找到匹配的食堂</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {filtered.map((canteen) => {
                const isExpanded = expandedId === canteen.id
                const aiSummary = aiSummaryMap[canteen.id]
                const isLoadingAi = loadingAiMap[canteen.id]

                return (
                  <div
                    key={canteen.id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    {/* Clickable card header */}
                    <button
                      onClick={() => toggleExpand(canteen.id)}
                      className="w-full text-left"
                    >
                      {renderCanteenImage(canteen)}

                      <div className="p-5">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {canteen.name}
                          </h3>
                          <span className="flex items-center gap-1 text-sm font-medium text-amber-500">
                            <RatingStars rating={canteen.rating} readonly />
                            <span className="ml-0.5">{canteen.rating}</span>
                          </span>
                        </div>
                        <p className="mb-3 text-sm text-gray-500">
                          {canteen.location}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {canteen.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>

                    {/* Expanded review section */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 py-4">
                        {/* ── AI 总结按钮 ── */}
                        <div className="mb-5">
                          {/* 已获取到结果：展示卡片 */}
                          {aiSummary ? (
                            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                              <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-purple-800">
                                <span>📊</span>
                                <span>AI评价总结</span>
                              </div>
                              <div className="space-y-1.5">
                                {aiSummary.split('\n').filter(Boolean).map((line, i) => (
                                  <p key={i} className="text-sm leading-relaxed text-gray-700">
                                    {line.trim()}
                                  </p>
                                ))}
                              </div>
                              <p className="mt-2 text-xs text-gray-400">由AI生成，仅供参考</p>
                            </div>
                          ) : isLoadingAi ? (
                            /* 加载中 */
                            <button
                              disabled
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-400 px-4 py-2.5 text-sm font-medium text-white cursor-not-allowed"
                            >
                              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                              </svg>
                              分析中...
                            </button>
                          ) : (
                            /* 可点击的按钮 */
                            <button
                              onClick={() => fetchAiSummary(canteen.id)}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 active:bg-purple-800"
                            >
                              <span>🤖</span>
                              <span>AI总结</span>
                              <span className="text-xs text-purple-200">让AI帮你分析评价</span>
                            </button>
                          )}
                        </div>

                        {/* ── Review Form ── */}
                        <div className="mb-5">
                          <ReviewForm
                            canteenId={canteen.id}
                            onSubmitSuccess={handleReviewSuccess}
                          />
                        </div>

                        {/* ── Review list ── */}
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">
                          历史评价（{canteenReviews.length}）
                        </h4>
                        {canteenReviews.length === 0 ? (
                          <p className="text-sm text-gray-400">暂无评价</p>
                        ) : (
                          <div className="space-y-3">
                            {canteenReviews.map((review) => (
                              <div
                                key={review.id}
                                className="rounded-lg border border-gray-100 bg-white p-3"
                              >
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-800">
                                    {review.username}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {review.time}
                                  </span>
                                </div>
                                <div className="mb-1">
                                  <RatingStars rating={review.rating} readonly />
                                </div>
                                <p className="text-sm leading-relaxed text-gray-600">
                                  {review.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
