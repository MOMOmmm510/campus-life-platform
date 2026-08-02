import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, apiRequest } from '../config/api.ts'

/* ── Types ── */
interface UserProfile {
  id: number
  username: string
  nickname: string
  avatar: string
  created_at: string
}

interface Item {
  id: number
  title: string
  description: string
  price: number
  category: string
  status: string
  created_at: string
}

interface Review {
  id: number
  canteen_id: number
  content: string
  rating: number
  created_at: string
}

interface CanteenMap {
  [id: number]: string
}

type ToastType = 'success' | 'error'

/* ── Toast ── */
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
          {type === 'success' ? <path d="M20 6L9 17l-5-5" /> : (
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

/* ── 小工具：显示昵称或用户名 ── */
function displayName(user: UserProfile | null): string {
  if (!user) return ''
  return user.nickname || user.username
}

/* ── 头像（首字母） ── */
function Avatar({ user, size = 'h-16 w-16 text-2xl' }: { user: UserProfile | null; size?: string }) {
  const name = displayName(user) || '?'
  const ch = name.charAt(0).toUpperCase()
  return (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 font-bold text-white ${size}`}>
      {ch}
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  /* ── 统计数据 ── */
  const [myItems, setMyItems] = useState<Item[]>([])
  const [favItems, setFavItems] = useState<Item[]>([])
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [canteenNames, setCanteenNames] = useState<CanteenMap>({})

  /* ── 弹窗状态 ── */
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /* ── 活动标签 ── */
  const [activeTab, setActiveTab] = useState<'publish' | 'favorite' | 'review'>('publish')

  const fetchProfile = useCallback(async () => {
    try {
      const json = await apiRequest<UserProfile>('/api/auth/me')
      setUser(json.data)
    } catch {
      // token 无效则回登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/auth')
    }
  }, [navigate])

  useEffect(() => {
    /* 未登录直接跳登录页 */
    if (!localStorage.getItem('token')) {
      navigate('/auth')
      return
    }
    fetchProfile().finally(() => setLoading(false))
    /* 并行拉取统计数据 */
    apiRequest<{ items: Item[] }>('/api/items?mine=1&limit=100').then((r) => setMyItems(r.data.items)).catch(() => {})
    apiRequest<{ itemIds: number[] }>('/api/favorites').then((r) => {
      const ids = r.data.itemIds
      if (ids.length === 0) {
        setFavItems([])
        return
      }
      /* 逐个拉取收藏商品详情（后端无批量接口，取前 50 个） */
      Promise.all(
        ids.slice(0, 50).map((id) =>
          apiRequest<Item>(`/api/items/${id}`).then((x) => x.data).catch(() => null)
        )
      ).then((list) => setFavItems(list.filter(Boolean) as Item[]))
    }).catch(() => {})
    apiRequest<{ reviews: Review[] }>('/api/reviews?mine=1&limit=100').then((r) => setMyReviews(r.data.reviews || [])).catch(() => {})
    apiRequest<{ id: number; name: string }[]>('/api/canteens').then((r) => {
      const map: CanteenMap = {}
      r.data.forEach((c) => { map[c.id] = c.name })
      setCanteenNames(map)
    }).catch(() => {})
  }, [navigate])

  /* ── 修改昵称 ── */
  const openNicknameModal = () => {
    setNicknameDraft(displayName(user))
    setShowNicknameModal(true)
  }

  const submitNickname = async () => {
    if (!nicknameDraft.trim()) {
      setToast({ message: '昵称不能为空', type: 'error' })
      return
    }
    setSubmitting(true)
    try {
      await apiRequest('/api/auth/profile', 'PUT', { nickname: nicknameDraft.trim() })
      setShowNicknameModal(false)
      setUser((prev) => (prev ? { ...prev, nickname: nicknameDraft.trim() } : prev))
      /* 同步更新 localStorage 中的 user 信息 */
      const raw = localStorage.getItem('user')
      if (raw) {
        const stored = JSON.parse(raw)
        stored.nickname = nicknameDraft.trim()
        localStorage.setItem('user', JSON.stringify(stored))
      }
      setToast({ message: '昵称修改成功', type: 'success' })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '昵称修改失败'
      setToast({ message: msg, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  /* ── 修改密码 ── */
  const submitPassword = async () => {
    if (!oldPassword || !newPassword) {
      setToast({ message: '请填写完整密码信息', type: 'error' })
      return
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      setToast({ message: '新密码长度为6-20位', type: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: '两次输入的新密码不一致', type: 'error' })
      return
    }
    setSubmitting(true)
    try {
      await apiRequest('/api/auth/password', 'PUT', { oldPassword, newPassword })
      setShowPwdModal(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setToast({ message: '密码修改成功，请重新登录', type: 'success' })
      setTimeout(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/auth')
      }, 1200)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '密码修改失败'
      setToast({ message: msg, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const closeToast = useCallback(() => setToast(null), [])

  /* ── 未登录时 loading ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 pt-24">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* ── 弹窗：修改昵称 ── */}
      {showNicknameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">修改昵称</h3>
            <input
              type="text"
              value={nicknameDraft}
              onChange={(e) => setNicknameDraft(e.target.value)}
              maxLength={20}
              placeholder="请输入新昵称"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowNicknameModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={submitNickname}
                disabled={submitting}
                className={`flex-1 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition ${
                  submitting ? 'cursor-not-allowed opacity-60' : 'hover:bg-blue-800'
                }`}
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 弹窗：修改密码 ── */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">修改密码</h3>
            <div className="space-y-4">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="当前密码"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新密码（6-20位）"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="确认新密码"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPwdModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={submitPassword}
                disabled={submitting}
                className={`flex-1 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white transition ${
                  submitting ? 'cursor-not-allowed opacity-60' : 'hover:bg-blue-800'
                }`}
              >
                {submitting ? '提交中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-6">
        {/* ═══ 个人信息卡 ═══ */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-24 bg-gradient-to-r from-blue-700 to-blue-500" />
          <div className="flex flex-col items-start gap-4 px-6 pb-6 sm:flex-row sm:items-end">
            <div className="-mt-10">
              <Avatar user={user} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{displayName(user)}</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                用户名：{user?.username}　·　注册于 {user?.created_at ? user.created_at.slice(0, 10) : '--'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openNicknameModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                修改昵称
              </button>
              <button
                onClick={() => setShowPwdModal(true)}
                className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
              >
                修改密码
              </button>
            </div>
          </div>
        </div>

        {/* ═══ 数据概览 ═══ */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-900">{myItems.length}</p>
            <p className="mt-1 text-xs text-gray-500">我的发布</p>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-900">{favItems.length}</p>
            <p className="mt-1 text-xs text-gray-500">我的收藏</p>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-900">{myReviews.length}</p>
            <p className="mt-1 text-xs text-gray-500">我的评价</p>
          </div>
        </div>

        {/* ═══ 我的活动 ═══ */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex border-b border-gray-100">
            {([
              ['publish', '我的发布'],
              ['favorite', '我的收藏'],
              ['review', '我的评价'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === key
                    ? 'border-b-2 border-blue-900 text-blue-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* 我的发布 */}
            {activeTab === 'publish' && (
              myItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">还没有发布过商品</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {myItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{item.title}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {item.category} · {item.created_at.slice(0, 10)}
                        </p>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        <span className="text-sm font-bold text-red-500">¥{item.price}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${item.status === '在售' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}

            {/* 我的收藏 */}
            {activeTab === 'favorite' && (
              favItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">还没有收藏任何商品</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {favItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{item.title}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {item.category} · {item.created_at.slice(0, 10)}
                        </p>
                      </div>
                      <span className="ml-3 text-sm font-bold text-red-500">¥{item.price}</span>
                    </li>
                  ))}
                </ul>
              )
            )}

            {/* 我的评价 */}
            {activeTab === 'review' && (
              myReviews.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">还没有发表过评价</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {myReviews.map((review) => (
                    <li key={review.id} className="py-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {canteenNames[review.canteen_id] || `食堂 #${review.canteen_id}`}
                        </span>
                        <span className="flex items-center text-xs text-amber-500">
                          <svg className="mr-1 h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {review.rating}星
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{review.content}</p>
                      <p className="mt-1 text-xs text-gray-400">{review.created_at.slice(0, 10)}</p>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </div>

        {/* ═══ 退出登录 ═══ */}
        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-200 bg-white px-6 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}
