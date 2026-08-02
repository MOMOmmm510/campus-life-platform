import { useState, useEffect, useCallback } from 'react'
import PostItemForm from '../components/PostItemForm.tsx'
import { ApiError, apiRequest } from '../config/api.ts'

interface Item {
  id: number
  title: string
  description: string
  price: number
  category: string
  images: string[]
  contact: string
  status: string
  user_id: number
  username: string
  created_at: string
}

const categories = ['全部', '教材', '电子', '生活', '其他']

type ToastType = 'success' | 'error'

/* ── Toast component ── */
function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className={`flex items-center gap-2 rounded-lg px-8 py-4 text-base font-medium text-white shadow-2xl ${
          type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {type === 'success' ? (
            <path d="M20 6L9 17l-5-5" />
          ) : (
            <>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </>
          )}
        </svg>
        {message}
      </div>
    </div>
  )
}

export default function TradePage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [animatingId, setAnimatingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const fetchItems = async (keyword?: string, category?: string) => {
    setLoading(true)
    setError(false)
    try {
      /* ── Build query params ── */
      const params = new URLSearchParams()
      if (keyword) params.set('keyword', keyword)
      if (category && category !== '全部') params.set('category', category)
      const qs = params.toString()

      const json = await apiRequest(`/api/items${qs ? `?${qs}` : ''}`)
      const data: Item[] = json.data.items
      setItems(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // 登录后从受保护接口加载收藏；未登录则保持空收藏。
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setFavorites(new Set())
      return
    }

    apiRequest<{ itemIds: number[] }>('/api/favorites')
      .then((json) => {
        setFavorites(new Set(json.data.itemIds))
      })
      .catch(() => {
        setFavorites(new Set())
      })
  }, [])

  const toggleFavorite = async (id: number) => {
    setAnimatingId(id)
    setTimeout(() => setAnimatingId(null), 300)

    const isFav = favorites.has(id)
    try {
      const json = await apiRequest<{ itemIds: number[] }>(
        `/api/favorites/${id}`,
        isFav ? 'DELETE' : 'POST',
      )
      setFavorites(new Set(json.data.itemIds))
      setToast({ message: isFav ? '已取消收藏' : '收藏成功', type: 'success' })
    } catch (err) {
      const message = err instanceof ApiError && err.status === 401
        ? err.message
        : '收藏失败，请稍后重试'
      setToast({ message, type: 'error' })
    }
  }

  /* ── Re-fetch when search or category changes ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems(searchText || undefined, activeCategory)
    }, 300) // debounce 300ms
    return () => clearTimeout(timer)
  }, [searchText, activeCategory])

  // Use items directly from backend (already filtered by query params)
  const filtered = items

  const handlePostSuccess = useCallback(() => {
    setShowForm(false)
    setToast({ message: '发布成功！', type: 'success' })
    // Re-fetch items from backend to get the real data
    fetchItems()
  }, [])

  const handleCancel = useCallback(() => {
    setShowForm(false)
  }, [])

  /* ── Skeleton loading ── */
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="h-44 w-full bg-gray-200" />
          <div className="p-4">
            <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
            <div className="mb-2 h-6 w-1/4 rounded bg-gray-200" />
            <div className="flex items-center justify-between">
              <div className="h-5 w-14 rounded-full bg-gray-200" />
              <div className="h-4 w-12 rounded bg-gray-200" />
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
        onClick={() => fetchItems()}
        className="rounded-lg bg-red-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-600"
      >
        重新加载
      </button>
    </div>
  )

  /* ── Empty image fallback ── */
  const renderItemImage = (item: Item) => {
    if (item.images && item.images.length > 0 && item.images[0]) {
      return (
        <img
          src={item.images[0]}
          alt={item.title}
          className="h-44 w-full object-cover"
        />
      )
    }
    return (
      <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
        <span className="text-2xl font-bold text-white/60">{item.category}</span>
      </div>
    )
  }

  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal overlay */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="relative w-full max-w-[680px] rounded-2xl bg-white shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <PostItemForm onSuccess={handlePostSuccess} onCancel={handleCancel} />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header row: title + post button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-blue-900">二手交易</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            发布商品
          </button>
        </div>

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
            placeholder="搜索商品名称"
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

        {/* Loading state */}
        {loading && renderSkeleton()}

        {/* Error state */}
        {!loading && error && renderError()}

        {/* Success state */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-gray-400">没有找到匹配的商品</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {filtered.map((item) => {
                  const isFav = favorites.has(item.id)
                  const isAnimating = animatingId === item.id

                  return (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                    >
                      {/* Favorite button */}
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition hover:bg-white"
                      >
                        <span
                          className={`select-none text-xl leading-none transition-transform ${
                            isAnimating ? 'scale-150' : 'scale-100'
                          } ${isFav ? 'text-red-500' : 'text-gray-400'}`}
                        >
                          {isFav ? '❤' : '♡'}
                        </span>
                      </button>

                      {/* Image */}
                      {renderItemImage(item)}

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="mb-1 truncate text-base font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        <p className="mb-2 text-lg font-bold text-red-500">
                          ¥{item.price}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                            {item.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {item.username}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
