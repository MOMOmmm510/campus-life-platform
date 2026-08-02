const jwt = require('jsonwebtoken')

const JWT_SECRET = 'campus-life-secret-key'

/**
 * 认证中间件 —— 从 Authorization 请求头提取并验证 JWT Token
 *
 * 在需要登录才能访问的路由上使用此中间件。
 * 验证通过后，req.user 会被挂载 { userId, username }。
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      data: null,
      message: '请先登录',
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    }
    next()
  } catch {
    return res.status(401).json({
      code: 401,
      data: null,
      message: 'Token 无效或已过期，请重新登录',
    })
  }
}

module.exports = { authMiddleware, JWT_SECRET }