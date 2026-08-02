import { useState, useRef, useCallback, useEffect } from 'react'
import { ApiError, apiRequest } from '../config/api.ts'

/* ── Types ── */
interface PostItemFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormData {
  title: string
  description: string
  price: string
  category: string
  images: File[]
  contact: string
}

interface FormErrors {
  title: string
  description: string
  price: string
  category: string
  contact: string
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
export default function PostItemForm({ onSuccess, onCancel }: PostItemFormProps) {
  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    images: [],
    contact: '',
  })
  const [errors, setErrors] = useState<FormErrors>({
    title: '',
    description: '',
    price: '',
    category: '',
    contact: '',
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  /* ── Helpers ── */
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateField = (field: keyof FormErrors): string => {
    switch (field) {
      case 'title':
        if (!form.title.trim()) return '请输入商品名称'
        if (form.title.trim().length < 2) return '商品名称至少2个字'
        if (form.title.trim().length > 30) return '商品名称不超过30个字'
        return ''
      case 'description':
        if (!form.description.trim()) return '请输入商品描述'
        if (form.description.trim().length < 10) return '描述至少10个字'
        if (form.description.trim().length > 500) return '描述不超过500个字'
        return ''
      case 'price': {
        if (!form.price.trim()) return '请输入价格'
        const n = parseFloat(form.price)
        if (isNaN(n) || n <= 0) return '请输入有效的价格'
        return ''
      }
      case 'category':
        if (!form.category) return '请选择分类'
        return ''
      case 'contact':
        if (!form.contact.trim()) return '请填写联系方式'
        return ''
      default:
        return ''
    }
  }

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({ ...prev, [field]: validateField(field) }))
  }

  const validateAll = (): boolean => {
    const fields: (keyof FormErrors)[] = ['title', 'description', 'price', 'category', 'contact']
    let valid = true
    const newErrors: FormErrors = { title: '', description: '', price: '', category: '', contact: '' }
    const newTouched: Record<string, boolean> = {}

    for (const f of fields) {
      newTouched[f] = true
      const err = validateField(f)
      newErrors[f] = err
      if (err) valid = false
    }

    setErrors(newErrors)
    setTouched(newTouched)
    return valid
  }

  /* ── Image handling ── */
  const addImages = useCallback(
    (files: FileList | File[]) => {
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      const valid = Array.from(files).filter((f) => allowed.includes(f.type))
      setForm((prev) => {
        const combined = [...prev.images, ...valid].slice(0, 3)
        return { ...prev, images: combined }
      })
    },
    []
  )

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) addImages(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  /* ── AI 描述生成 ── */
  const fetchAiDescription = async () => {
    /* 验证 */
    if (!form.title.trim()) {
      setToast({ message: '请先填写商品名称', type: 'error' })
      return
    }
    if (!form.price.trim()) {
      setToast({ message: '请先填写价格', type: 'error' })
      return
    }

    setAiLoading(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        price: parseFloat(form.price),
      }
      // 如果有成色和联系方式，也一并传入作为使用情况参考
      if (form.contact.trim()) body.usage = form.contact.trim()

      const json = await apiRequest('/api/ai/generate-description', 'POST', body)
      const description = json.data.description
      updateField('description', description)
      setToast({ message: 'AI描述已生成，你可以修改后发布', type: 'success' })
    } catch {
      setToast({ message: 'AI生成失败，请手动填写描述', type: 'error' })
    } finally {
      setAiLoading(false)
    }
  }

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    setSubmitting(true)
    try {
      await apiRequest('/api/items', 'POST', {
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        category: form.category,
        images: [], // File objects cannot be serialized; images are placeholder UX
        contact: form.contact.trim(),
      })

      setToast({ message: '发布成功！', type: 'success' })
      setForm({ title: '', description: '', price: '', category: '', images: [], contact: '' })
      setTouched({})
      setErrors({ title: '', description: '', price: '', category: '', contact: '' })
      // Let the user see the success toast before closing
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

  /* ── Image preview URLs (cleanup on unmount) ── */
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  useEffect(() => {
    const urls = form.images.map((f) => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [form.images])

  return (
    <>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mx-auto max-w-[640px] px-6 py-10">
        <h1 className="mb-8 text-3xl font-bold text-blue-900">发布二手商品</h1>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* ── Title ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              商品名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入商品名称"
              maxLength={30}
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                touched.title && errors.title
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
            />
            {touched.title && errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* ── Description ── */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                商品描述 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                disabled={aiLoading}
                onClick={fetchAiDescription}
                className="flex items-center gap-1 rounded-md border border-purple-300 px-2.5 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    生成中...
                  </>
                ) : (
                  <>🤖 AI帮我写描述</>
                )}
              </button>
            </div>
            <div className="relative">
              <textarea
                placeholder="请描述商品的成色、使用情况等"
                rows={5}
                maxLength={500}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                className={`w-full resize-none rounded-lg border px-3 py-2.5 pr-20 text-sm outline-none transition focus:ring-2 ${
                  touched.description && errors.description
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-gray-400">
                {form.description.length}/500
              </span>
            </div>
            {touched.description && errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* ── Price ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              价格 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">¥</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                onBlur={() => handleBlur('price')}
                className={`w-full rounded-lg border py-2.5 pl-8 pr-3 text-sm outline-none transition focus:ring-2 ${
                  touched.price && errors.price
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
            </div>
            {touched.price && errors.price && (
              <p className="mt-1 text-xs text-red-500">{errors.price}</p>
            )}
          </div>

          {/* ── Category ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              分类 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              onBlur={() => handleBlur('category')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                touched.category && errors.category
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              } ${!form.category ? 'text-gray-400' : 'text-gray-900'}`}
            >
              <option value="" disabled>
                请选择分类
              </option>
              <option value="教材">教材</option>
              <option value="电子">电子</option>
              <option value="生活">生活</option>
              <option value="其他">其他</option>
            </select>
            {touched.category && errors.category && (
              <p className="mt-1 text-xs text-red-500">{errors.category}</p>
            )}
          </div>

          {/* ── Images ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              图片 <span className="text-sm text-gray-400">（选填，最多3张）</span>
            </label>
            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 transition ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <svg
                className="mb-2 h-8 w-8 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <p className="text-sm text-gray-500">点击或拖拽上传图片</p>
              <p className="mt-1 text-xs text-gray-400">支持 JPG、PNG、GIF、WebP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addImages(e.target.files)
                e.target.value = ''
              }}
            />

            {/* Image previews */}
            {previewUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={url}
                      alt={`预览 ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Contact ── */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              联系方式 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="手机号或微信号"
              value={form.contact}
              onChange={(e) => updateField('contact', e.target.value)}
              onBlur={() => handleBlur('contact')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
                touched.contact && errors.contact
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
            />
            {touched.contact && errors.contact && (
              <p className="mt-1 text-xs text-red-500">{errors.contact}</p>
            )}
          </div>

          {/* ── Buttons ── */}
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                取消
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition ${
                submitting
                  ? 'cursor-not-allowed opacity-60'
                  : 'hover:bg-blue-800'
              }`}
            >
              {submitting ? '发布中...' : '发布商品'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
