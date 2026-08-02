import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/schedule', label: '课表' },
  { to: '/canteen', label: '食堂' },
  { to: '/trade', label: '二手' },
  { to: '/lost-found', label: '失物招领' },
]

interface UserInfo {
  id: number
  username: string
}

interface AuthState {
  token: string | null
  user: UserInfo | null
}

function getAuthStateFromStorage(): AuthState {
  try {
    const token = localStorage.getItem('token')
    const raw = localStorage.getItem('user')
    return {
      token,
      user: raw ? (JSON.parse(raw) as UserInfo) : null,
    }
  } catch {
    return { token: localStorage.getItem('token'), user: null }
  }
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [auth, setAuth] = useState<AuthState>(getAuthStateFromStorage)
  const isLoggedIn = Boolean(auth.token)
  const username = auth.user?.username || '已登录用户'

  /* ── 路由变化后重新读取登录状态，例如登录成功跳转首页 ── */
  useEffect(() => {
    setAuth(getAuthStateFromStorage())
  }, [location.pathname])

  /* ── 监听其他标签页中的登录状态变化 ── */
  useEffect(() => {
    const onStorage = () => setAuth(getAuthStateFromStorage())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuth({ token: null, user: null })
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1e3a5f] text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="text-xl font-bold tracking-wide">
          校园生活服务平台
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-md px-3 py-1.5 text-sm text-white transition hover:text-blue-200"
            >
              {label}
            </Link>
          ))}

          {isLoggedIn ? (
            <div className="ml-2 flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm text-white transition hover:text-blue-200"
                title="进入个人中心"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {username}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md border border-white px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white hover:text-blue-900"
              >
                退出登录
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="ml-2 rounded-md border border-white px-4 py-1.5 text-sm font-medium text-white transition hover:bg-white hover:text-blue-900"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
