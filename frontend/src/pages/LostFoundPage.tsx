import { useState, useEffect, useCallback } from 'react'
import LostFoundForm from '../components/LostFoundForm.tsx'
import { apiRequest } from '../config/api.ts'

interface LostFoundItem {
  id: number
  type: '丢失' | '捡到'
  title: string
  location: string
  time: string
  created_at?: string
  description: string
}

/* ── Toast component ── */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="flex items-center gap-2 rounded-lg bg-green-500 px-8 py-4 text-base font-medium text-white shadow-2xl">
        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
        {message}
      </div>
    </div>
  )
}

export default function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    setError(false)
    try {
      const json = await apiRequest('/api/lost-found')
      const itemsArr: LostFoundItem[] = json.data.items || []
      // Sort by created_at descending (newest first)
      const sorted = itemsArr.sort(
        (a, b) => new Date(b.created_at || b.time).getTime() - new Date(a.created_at || a.time).getTime()
      )
      setItems(sorted)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handlePostSuccess = useCallback(() => {
    setShowForm(false)
    setToast('发布成功！')
    fetchItems()
  }, [])

  /* ── Skeleton loading ── */
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-6 w-14 rounded-full bg-gray-200" />
              <div className="h-5 w-40 rounded bg-gray-200" />
            </div>
            <div className="mb-3 flex items-center gap-4">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
            <div className="h-4 w-3/4 rounded bg-gray-200" />
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
        onClick={fetchItems}
        className="rounded-lg bg-red-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-600"
      >
        重新加载
      </button>
    </div>
  )

  /* ── Type badge ── */
  const renderTypeBadge = (type: '丢失' | '捡到') => {
    if (type === '丢失') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-0.5 text-sm font-medium text-red-600">
          <svg
            className="mr-1 h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          丢失
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-0.5 text-sm font-medium text-green-600">
        <svg
          className="mr-1 h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        捡到
      </span>
    )
  }

  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

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
            <LostFoundForm onSuccess={handlePostSuccess} />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header row: title + post button */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-blue-900">失物招领</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            发布信息
          </button>
        </div>

        {/* Loading state */}
        {loading && renderSkeleton()}

      {/* Error state */}
      {!loading && error && renderError()}

      {/* Success state */}
      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <p className="py-12 text-center text-gray-400">暂无失物招领信息</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  {/* Header: badge + title */}
                  <div className="mb-3 flex items-center gap-3">
                    {renderTypeBadge(item.type)}
                    <h3 className="text-base font-semibold text-gray-900">
                      {item.title}
                    </h3>
                  </div>

                  {/* Meta: location + time */}
                  <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {item.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {item.time}
                    </span>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm leading-relaxed text-gray-600">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
    </>
  )
}
