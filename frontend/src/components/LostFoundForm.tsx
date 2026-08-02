import { useState, useEffect, useCallback } from 'react'
import { ApiError, apiRequest } from '../config/api.ts'

/* ── Props ── */
interface LostFoundFormProps {
  onSuccess?: () => void
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
export default function LostFoundForm({ onSuccess }: LostFoundFormProps) {
  const [type, setType] = useState<'丢失' | '捡到' | ''>('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [touched, setTouched] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const validate = (): boolean => {
    if (!type) {
      setError('请选择类型')
      return false
    }
    if (!title.trim()) {
      setError('请输入物品名称')
      return false
    }
    if (title.trim().length < 2) {
      setError('物品名称至少2个字')
      return false
    }
    if (title.trim().length > 20) {
      setError('物品名称不超过20个字')
      return false
    }
    if (!location.trim()) {
      setError('请输入地点')
      return false
    }
    if (!date) {
      setError('请选择日期')
      return false
    }
    if (!description.trim()) {
      setError('请输入描述')
      return false
    }
    if (description.trim().length < 5) {
      setError('描述至少5个字')
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
      await apiRequest('/api/lost-found', 'POST', {
        type,
        title: title.trim(),
        location: location.trim(),
        date,
        description: description.trim(),
      })

      setToast({ message: '发布成功！', type: 'success' })
      setType('')
      setTitle('')
      setLocation('')
      setDate('')
      setDescription('')
      setError('')
      setTouched(false)
      // Let the user see the success toast before closing the modal
      setTimeout(() => {
        onSuccess?.()
      }, 1000)
    } catch (err) {
      const message = err instanceof ApiError && err.status === 401
        ? err.message
        : '发布失败，请稍后重试'
      setToast({ message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseToast = useCallback(() => setToast(null), [])

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
      touched && hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
    }`

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={handleCloseToast} />}

      <div className="mx-auto max-w-[640px] px-6 py-10">
        <h1 className="mb-8 text-3xl font-bold text-blue-900">发布失物招领</h1>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* ── Type toggle ── */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('丢失')
                  if (touched) setError('')
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-5 py-2.5 text-sm font-medium transition ${
                  type === '丢失'
                    ? 'border-blue-900 bg-blue-900 text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                丢失
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('捡到')
                  if (touched) setError('')
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-5 py-2.5 text-sm font-medium transition ${
                  type === '捡到'
                    ? 'border-blue-900 bg-blue-900 text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                捡到
              </button>
            </div>
          </div>

          {/* ── Title ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              物品名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入物品名称"
              maxLength={20}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              className={inputClass(!title.trim() || title.trim().length < 2)}
            />
            {touched && !title.trim() && (
              <p className="mt-1 text-xs text-red-500">请输入物品名称</p>
            )}
            {touched && title.trim() && title.trim().length < 2 && (
              <p className="mt-1 text-xs text-red-500">物品名称至少2个字</p>
            )}
          </div>

          {/* ── Location ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              地点 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="如：图书馆二楼"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => setTouched(true)}
              className={inputClass(!location.trim())}
            />
            {touched && !location.trim() && (
              <p className="mt-1 text-xs text-red-500">请输入地点</p>
            )}
          </div>

          {/* ── Date ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => setTouched(true)}
              className={inputClass(!date)}
            />
            {touched && !date && (
              <p className="mt-1 text-xs text-red-500">请选择日期</p>
            )}
          </div>

          {/* ── Description ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              描述 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                placeholder="请描述物品的详细信息..."
                rows={4}
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setTouched(true)}
                className={`w-full resize-none rounded-lg border px-3 py-2.5 pr-20 text-sm outline-none transition focus:ring-2 ${
                  touched && (!description.trim() || description.trim().length < 5)
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-gray-400">
                {description.length}/200
              </span>
            </div>
            {touched && !description.trim() && (
              <p className="mt-1 text-xs text-red-500">请输入描述</p>
            )}
            {touched && description.trim() && description.trim().length < 5 && (
              <p className="mt-1 text-xs text-red-500">描述至少5个字</p>
            )}
          </div>

          {/* ── Error message ── */}
          {touched && error && !['请输入物品名称', '物品名称至少2个字', '请输入地点', '请选择日期', '请输入描述', '描述至少5个字'].includes(error) && (
            <p className="text-xs text-red-500">{error}</p>
          )}

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
            {submitting ? '提交中...' : '发布'}
          </button>
        </form>
      </div>
    </>
  )
}
