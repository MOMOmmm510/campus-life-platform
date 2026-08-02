const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const router = express.Router()

const VALID_TYPES = ['丢失', '捡到']

/* ── Helper: find by id with username ── */
function findById(db, id) {
  const stmt = db.prepare(`
    SELECT l.*, COALESCE(u.username, '用户') AS username
    FROM lost_found l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.id = ?
  `)
  stmt.bind([id])
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

/* ══════════════════════════════════════════════
   1. GET / —— 获取列表（搜索 & 筛选 & 分页）
   ══════════════════════════════════════════════ */
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db')
    const { type, keyword, page = '1', limit = '10' } = req.query
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)
    const offset = (pageNum - 1) * limitNum

    /* ── Build WHERE clause ── */
    const whereClauses = []
    const params = []

    if (type && VALID_TYPES.includes(type)) {
      whereClauses.push('l.type = ?')
      params.push(type)
    }

    if (keyword && keyword.trim()) {
      whereClauses.push('(l.title LIKE ? OR l.description LIKE ? OR l.location LIKE ?)')
      const kw = `%${keyword.trim()}%`
      params.push(kw, kw, kw)
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

    /* ── Count total ── */
    const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM lost_found l ${whereSQL}`)
    countStmt.bind(params)
    let total = 0
    if (countStmt.step()) {
      total = countStmt.getAsObject().total
    }
    countStmt.free()

    /* ── Query items ── */
    const querySql = `
      SELECT l.*, COALESCE(u.username, '用户') AS username
      FROM lost_found l
      LEFT JOIN users u ON l.user_id = u.id
      ${whereSQL}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `
    const queryStmt = db.prepare(querySql)
    queryStmt.bind([...params, limitNum, offset])

    const items = []
    while (queryStmt.step()) {
      items.push(queryStmt.getAsObject())
    }
    queryStmt.free()

    res.json({
      code: 200,
      data: { items, total, page: pageNum, limit: limitNum },
      message: 'success',
    })
  } catch (err) {
    console.error('查询失物招领列表失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   2. GET /:id —— 获取详情
   ══════════════════════════════════════════════ */
router.get('/:id', (req, res) => {
  try {
    const db = req.app.get('db')
    const id = parseInt(req.params.id, 10)
    const item = findById(db, id)

    if (!item) {
      return res.status(404).json({ code: 404, data: null, message: '信息不存在' })
    }

    res.json({ code: 200, data: item, message: 'success' })
  } catch (err) {
    console.error('查询失物招领详情失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   3. POST / —— 发布信息（需登录）
   ══════════════════════════════════════════════ */
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const { type, title, location, date, description } = req.body

    /* ── Validation ── */
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ code: 400, data: null, message: 'type 必填，须为"丢失"或"捡到"' })
    }
    if (!title || typeof title !== 'string' || title.length < 2 || title.length > 20) {
      return res.status(400).json({ code: 400, data: null, message: 'title 必填，2-20字' })
    }
    if (!location || typeof location !== 'string') {
      return res.status(400).json({ code: 400, data: null, message: 'location 必填' })
    }
    if (!description || typeof description !== 'string' || description.length < 1) {
      return res.status(400).json({ code: 400, data: null, message: 'description 必填' })
    }

    /* ── Insert ── */
    const time = date || new Date().toISOString().slice(0, 10)
    const created_at = new Date().toISOString()
    const user_id = req.user.userId

    const insertStmt = db.prepare(
      'INSERT INTO lost_found (type, title, location, time, description, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    insertStmt.run([type, title.trim(), location.trim(), time, description.trim(), user_id, created_at])
    insertStmt.free()

    /* ── Fetch newly created record ── */
    const lastIdResult = db.exec('SELECT last_insert_rowid() AS id')
    const newId = lastIdResult[0].values[0][0]
    const newItem = findById(db, newId)

    /* ── Persist to disk ── */
    const { saveDatabase } = require('../database/connection')
    saveDatabase()

    res.status(201).json({ code: 201, data: newItem, message: '发布成功' })
  } catch (err) {
    console.error('发布失物招领失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   4. PUT /:id —— 修改信息（需登录）
   ══════════════════════════════════════════════ */
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const id = parseInt(req.params.id, 10)
    const { type, title, location, date, description } = req.body

    /* ── Check existence ── */
    const existing = findById(db, id)
    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '信息不存在' })
    }

    /* ── Check permission ── */
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权修改此信息' })
    }

    /* ── Validate and build SET clause ── */
    const setClauses = []
    const params = []

    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ code: 400, data: null, message: 'type 须为"丢失"或"捡到"' })
      }
      setClauses.push('type = ?')
      params.push(type)
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || title.length < 2 || title.length > 20) {
        return res.status(400).json({ code: 400, data: null, message: 'title 2-20字' })
      }
      setClauses.push('title = ?')
      params.push(title.trim())
    }

    if (location !== undefined) {
      setClauses.push('location = ?')
      params.push(location.trim())
    }

    if (date !== undefined) {
      setClauses.push('time = ?')
      params.push(date)
    }

    if (description !== undefined) {
      setClauses.push('description = ?')
      params.push(description.trim())
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ code: 400, data: null, message: '没有需要更新的字段' })
    }

    /* ── Update ── */
    params.push(id)
    const updateStmt = db.prepare(
      `UPDATE lost_found SET ${setClauses.join(', ')} WHERE id = ?`
    )
    updateStmt.run(params)
    updateStmt.free()

    /* ── Fetch updated record ── */
    const updated = findById(db, id)

    /* ── Persist to disk ── */
    const { saveDatabase } = require('../database/connection')
    saveDatabase()

    res.json({ code: 200, data: updated, message: '修改成功' })
  } catch (err) {
    console.error('修改失物招领失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

/* ══════════════════════════════════════════════
   5. DELETE /:id —— 删除信息（需登录，真删除）
   ══════════════════════════════════════════════ */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = req.app.get('db')
    const id = parseInt(req.params.id, 10)

    /* ── Check existence ── */
    const existing = findById(db, id)
    if (!existing) {
      return res.status(404).json({ code: 404, data: null, message: '信息不存在' })
    }

    /* ── Check permission ── */
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({ code: 403, data: null, message: '无权删除此信息' })
    }

    /* ── Delete ── */
    const deleteStmt = db.prepare('DELETE FROM lost_found WHERE id = ?')
    deleteStmt.run([id])
    deleteStmt.free()

    /* ── Persist to disk ── */
    const { saveDatabase } = require('../database/connection')
    saveDatabase()

    res.json({ code: 200, data: null, message: '删除成功' })
  } catch (err) {
    console.error('删除失物招领失败:', err)
    res.status(500).json({ code: 500, data: null, message: '数据库查询失败' })
  }
})

module.exports = router