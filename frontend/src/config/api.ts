/**
 * API 统一配置文件
 *
 * 本地开发：通过 Vite proxy 代理 /api 请求到后端（http://localhost:3001），
 *           因此 API_BASE 默认设为空字符串即可。
 * 生产部署（Vercel）：通过 VITE_API_BASE 环境变量指定后端地址（如 Railway 域名），
 *           构建时注入：VITE_API_BASE=https://xxx.up.railway.app
 */

/** 后端 API 基础地址 */
export const API_BASE = import.meta.env.VITE_API_BASE || ''

export class ApiError extends Error {
  status: number
  code?: number
  data?: unknown

  constructor(message: string, status: number, code?: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

/**
 * 拼接完整的 API 地址
 * @param path API 路径，例如 '/api/canteens'
 * @returns 完整 URL，例如 '/api/canteens'
 */
export function getApiUrl(path: string): string {
  return `${API_BASE}${path}`
}

/**
 * 带认证的请求工具函数
 *
 * @param url   请求路径（如 '/api/reviews'）或完整 URL（如 'http://localhost:3001/api/reviews'）
 * @param method 请求方法，默认 'GET'
 * @param body  请求体（可选），会自动 JSON.stringify
 * @returns { code, data, message } 格式的响应数据
 */
export async function apiRequest<T = any>(
  url: string,
  method: string = 'GET',
  body?: Record<string, any>,
): Promise<{ code: number; data: T; message: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  /* ── 从 localStorage 读取 token ── */
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  /* ── 拼接 API_BASE（生产环境指向 Railway 后端） ── */
  const fullUrl = getApiUrl(url)

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()

  /* ── 非 2xx 状态码时抛出错误，让调用方的 try/catch 能捕获 ── */
  if (!res.ok) {
    throw new ApiError(json.message || '请求失败', res.status, json.code, json.data)
  }

  return json
}
