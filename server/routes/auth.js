const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { authMiddleware, JWT_SECRET } = require('../middleware/auth')
const { saveDatabase } = require('../database/connection')

const router = express.Router()

/* ══════════════════════════════════════════════
   1. POST /api/auth/register —— 用户注册
   ══════════════════════════════════════════════ */
router.post('/register', async (req, res) => {
  try {
    const db = req.app.get('db')
    const { username, password } = req.body

    /* ── Validation ── */
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ code: 400, data: null, message: '用户名必填' })
    }
    if (!/^[a-zA-Z0-9]{3,16}$/.test(username)) {
      return res.status(400).json({ code: 400, data: null, message: '用户名只能包含字母和数字，3-16位' })
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ code: 400, data: null, message: '密码必填' })
    }
    if (password.length < 6 || password.length > 20) {
      return res.status(400).json({ code: 400, data: null, message: '密码长度为6-20位' })
    }

    /* ── Check if username already exists ── */
    const checkStmt = db.prepare('SELECT id FROM users WHERE username = ?')
    checkStmt.bind([username])
    const exists = checkStmt.step() // true if a row exists
    checkStmt.free()
    if (exists) {
      return res.status(400).json({ code: 400, data: null, message: '用户名已存在' })
    }

    /* ── Hash password ── */
    const hashedPassword = await bcrypt.hash(password, 10)

    /* ── Insert into database ── */
    const insertStmt = db.prepare(
      'INSERT INTO users (username, password, avatar, nickname) VALUES (?, ?, ?, ?)'
    )
    insertStmt.run([username, hashedPassword, '', username])
    insertStmt.free()

    /* ── Get the newly created user ── */
    const lastIdResult = db.exec('SELECT last_insert_rowid() AS id')
    const newId = lastIdResult[0].values[0][0]

    /* ── Persist to disk ── */
    saveDatabase()

    res.status(201).json({
      code: 201,
      data: { id: newId, username },
      message: '注册成功',
    })
  } catch (err) {
    console.error('注册失败:', err)
    res.status(500).json({ code: 500, data: null, message: '服务器内部错误' })
  }
})

/* ══════════════════════════════════════════════
   2. POST /api/auth/login —— 用户登录
   ══════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  try {
    const db = req.app.get('db')
    const { username, password } = req.body

    /* ── Validation ── */
    if (!username || !password) {
      return res.status(400).json({ code: 400, data: null, message: '用户名和密码必填' })
    }

    /* ── Query user by username ── */
    const userStmt = db.prepare('SELECT id, username, password FROM users WHERE username = ?')
    userStmt.bind([username])

    if (!userStmt.step()) {
      userStmt.free()
      return res.status(401).json({ code: 401, data: null, message: '用户名不存在' })
    }

    const user = userStmt.getAsObject()
    userStmt.free()

    /* ── Verify password ── */
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ code: 401, data: null, message: '密码错误' })
    }

    /* ── Generate JWT Token ── */
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      code: 200,
      data: {
        token,
        user: { id: user.id, username: user.username },
      },
      message: '登录成功',
    })
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({ code: 500, data: null, message: '服务器内部错误' })
  }
})

/* ══════════════════════════════════════════════
   3. GET /api/auth/me —— 获取当前用户信息（需认证）
   ══════════════════════════════════════════════ */
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const { userId } = req.user

    const userStmt = db.prepare('SELECT id, username, nickname, avatar, created_at FROM users WHERE id = ?')
    userStmt.bind([userId])

    if (!userStmt.step()) {
      userStmt.free()
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' })
    }

    const user = userStmt.getAsObject()
    userStmt.free()

    res.json({
      code: 200,
      data: user,
      message: 'success',
    })
  } catch (err) {
    console.error('获取用户信息失败:', err)
    res.status(500).json({ code: 500, data: null, message: '服务器内部错误' })
  }
})

/* ══════════════════════════════════════════════
   4. PUT /api/auth/profile —— 修改昵称（需认证）
   ══════════════════════════════════════════════ */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const db = req.app.get('db')
    const { userId } = req.user
    const { nickname } = req.body

    if (!nickname || typeof nickname !== 'string') {
      return res.status(400).json({ code: 400, data: null, message: '昵称必填' })
    }
    const trimmed = nickname.trim()
    if (trimmed.length < 1 || trimmed.length > 20) {
      return res.status(400).json({ code: 400, data: null, message: '昵称长度为1-20个字符' })
    }

    const stmt = db.prepare('UPDATE users SET nickname = ? WHERE id = ?')
    stmt.run([trimmed, userId])
    stmt.free()
    saveDatabase()

    res.json({ code: 200, data: { nickname: trimmed }, message: '昵称修改成功' })
  } catch (err) {
    console.error('修改昵称失败:', err)
    res.status(500).json({ code: 500, data: null, message: '服务器内部错误' })
  }
})

/* ══════════════════════════════════════════════
   5. PUT /api/auth/password —— 修改密码（需认证）
   ══════════════════════════════════════════════ */
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const db = req.app.get('db')
    const { userId } = req.user
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 400, data: null, message: '旧密码和新密码必填' })
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      return res.status(400).json({ code: 400, data: null, message: '新密码长度为6-20位' })
    }

    const userStmt = db.prepare('SELECT password FROM users WHERE id = ?')
    userStmt.bind([userId])
    if (!userStmt.step()) {
      userStmt.free()
      return res.status(404).json({ code: 404, data: null, message: '用户不存在' })
    }
    const user = userStmt.getAsObject()
    userStmt.free()

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ code: 400, data: null, message: '旧密码错误' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?')
    updateStmt.run([hashedPassword, userId])
    updateStmt.free()
    saveDatabase()

    res.json({ code: 200, data: null, message: '密码修改成功' })
  } catch (err) {
    console.error('修改密码失败:', err)
    res.status(500).json({ code: 500, data: null, message: '服务器内部错误' })
  }
})

module.exports = router
