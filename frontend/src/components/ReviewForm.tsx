import { useState, useEffect, useCallback } from 'react'
import RatingStars from './RatingStars.tsx'
import { ApiError, apiRequest } from '../config/api.ts'

/* ── Props ── */
interface ReviewFormProps {
  canteenId: number
  onSubmitSuccess?: () => void
}

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
        {type === 'success' ? (
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        )}
        {message}
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function ReviewForm({ canteenId: _canteenId, onSubmitSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [touched, setTouched] = useState(false)

  const validate = (): boolean => {
    if (rating === 0) {
      setError('请给食堂打分')
      return false
    }
    if (!content.trim()) {
      setError('请输入评价内容')
      return false
    }
    if (content.trim().length < 5) {
      setError('评价至少5个字')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!validate()) return

    setSubmitting(true)
    try {
      await apiRequest('/api/reviews', 'POST', {
        canteen_id: _canteenId,
        content: content.trim(),
        rating,
      })

      setToast({ message: '评价提交成功！', type: 'success' })
      setRating(0)
      setContent('')
      setError('')
      setTouched(false)
      // Refresh the review list from backend
      setTimeout(() => {
        onSubmitSuccess?.()
      }, 1000)
    } catch (err) {
      const message = err instanceof ApiError && err.status === 401
        ? err.message
        : '提交失败，请稍后重试'
      setToast({ message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseToast = useCallback(() => setToast(null), [])

  /* ── Rating label ── */
  const ratingLabels = ['', '很差', '较差', '一般', '满意', '非常好']

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={handleCloseToast} />}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-800">写评价</h3>

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Rating ── */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              评分 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-50/60 px-4 py-3">
              <RatingStars
                rating={rating}
                onChange={(val) => {
                  setRating(val)
                  if (touched) {
                    setError(val === 0 ? '请给食堂打分' : '')
                  }
                }}
              />
              {rating > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-amber-500">{rating}</span>
                  <span className="text-sm text-gray-500">/ 5</span>
                  <span className="ml-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    {ratingLabels[rating]}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* ── Content ── */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              评价内容 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                placeholder="说说你的用餐体验..."
                rows={4}
                maxLength={200}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  if (touched) {
                    const val = e.target.value
                    if (!val.trim()) setError('请输入评价内容')
                    else if (val.trim().length < 5) setError('评价至少5个字')
                    else setError('')
                  }
                }}
                onBlur={() => {
                  setTouched(true)
                  if (rating === 0) setError('请给食堂打分')
                  else if (!content.trim()) setError('请输入评价内容')
                  else if (content.trim().length < 5) setError('评价至少5个字')
                  else setError('')
                }}
                className={`w-full resize-none rounded-lg border px-3 py-2.5 pr-20 text-sm outline-none transition focus:ring-2 ${
                  touched && error
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-gray-400">
                {content.length}/200
              </span>
            </div>
            {touched && error && (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition ${
              submitting
                ? 'cursor-not-allowed bg-blue-900/60'
                : 'bg-blue-900 hover:bg-blue-800'
            }`}
          >
            {submitting ? '提交中...' : '提交评价'}
          </button>
        </form>
      </div>
    </>
  )
}
