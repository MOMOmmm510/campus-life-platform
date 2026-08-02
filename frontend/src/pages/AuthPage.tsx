import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../config/api.ts'

type Tab = 'login' | 'register'
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

/* ── Login form ── */
function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const validate = (): boolean => {
    const newErrors = { username: '', password: '' }
    let valid = true

    if (!username.trim()) {
      newErrors.username = '请输入用户名'
      valid = false
    }
    if (!password.trim()) {
      newErrors.password = '请输入密码'
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const json = await apiRequest('/api/auth/login', 'POST', {
        username: username.trim(),
        password,
      })

      // Save token and user info to localStorage
      localStorage.setItem('token', json.data.token)
      localStorage.setItem('user', JSON.stringify(json.data.user))

      setToast({ message: '登录成功！', type: 'success' })
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err: any) {
      setToast({ message: err.message || '登录失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseToast = useCallback(() => setToast(null), [])

  const clearError = (field: 'username' | 'password') => {
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={handleCloseToast} />}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Username */}
        <div>
          <label htmlFor="login-username" className="mb-1 block text-sm font-medium text-gray-700">
            用户名
          </label>
          <input
            id="login-username"
            type="text"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => clearError('username')}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
              errors.username
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }`}
          />
          {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-gray-700">
            密码
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => clearError('password')}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
              errors.password
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }`}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {loading ? '登录中...' : '登录'}
        </button>

        <p className="text-center text-sm text-gray-500">
          还没有账号？
          <button type="button" onClick={onSwitchToRegister} className="ml-1 text-blue-900 hover:underline">
            立即注册
          </button>
        </p>
      </form>
    </>
  )
}

/* ── Register form ── */
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({ username: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const validate = (): boolean => {
    const newErrors = { username: '', password: '', confirmPassword: '' }
    let valid = true

    const usernameRegex = /^[a-zA-Z0-9]+$/

    if (!username.trim()) {
      newErrors.username = '请输入用户名'
      valid = false
    } else if (!usernameRegex.test(username.trim()) || username.trim().length < 3 || username.trim().length > 16) {
      newErrors.username = '用户名只能包含字母和数字，3-16字'
      valid = false
    }

    if (!password.trim()) {
      newErrors.password = '请输入密码'
      valid = false
    } else if (password.length < 6) {
      newErrors.password = '密码至少6位'
      valid = false
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = '请确认密码'
      valid = false
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await apiRequest('/api/auth/register', 'POST', {
        username: username.trim(),
        password,
      })

      setToast({ message: '注册成功！', type: 'success' })
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setToast({ message: err.message || '注册失败', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseToast = useCallback(() => setToast(null), [])

  const clearError = (field: 'username' | 'password' | 'confirmPassword') => {
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const inputClass = (field: 'username' | 'password' | 'confirmPassword') =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
    }`

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={handleCloseToast} />}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Username */}
        <div>
          <label htmlFor="reg-username" className="mb-1 block text-sm font-medium text-gray-700">
            用户名 <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-username"
            type="text"
            placeholder="字母和数字，3-16字"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => clearError('username')}
            className={inputClass('username')}
          />
          {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-gray-700">
            密码 <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-password"
            type="password"
            placeholder="6-20位密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => clearError('password')}
            className={inputClass('password')}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="reg-confirm" className="mb-1 block text-sm font-medium text-gray-700">
            确认密码 <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-confirm"
            type="password"
            placeholder="再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => clearError('confirmPassword')}
            className={inputClass('confirmPassword')}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
    </>
  )
}

/* ── AuthPage ── */
export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-16">
      <div className="w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Tab bar */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            onClick={() => setTab('login')}
            className={`relative pb-3 text-sm font-medium transition ${
              tab === 'login' ? 'text-blue-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{ width: '50%' }}
          >
            登录
            {tab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900" />
            )}
          </button>
          <button
            onClick={() => setTab('register')}
            className={`relative pb-3 text-sm font-medium transition ${
              tab === 'register' ? 'text-blue-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{ width: '50%' }}
          >
            注册
            {tab === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900" />
            )}
          </button>
        </div>

        {/* Form content */}
        {tab === 'login' ? (
          <LoginForm onSwitchToRegister={() => setTab('register')} />
        ) : (
          <RegisterForm onSuccess={() => setTab('login')} />
        )}
      </div>
    </div>
  )
}